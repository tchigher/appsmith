package com.appsmith.server.solutions;

import com.appsmith.server.authentication.handlers.AuthenticationSuccessHandler;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import static org.springframework.security.web.server.context.WebSessionServerSecurityContextRepository.DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME;

@Component
@RequiredArgsConstructor
public class UserSignup {

    private final UserService userService;
    private final AuthenticationSuccessHandler authenticationSuccessHandler;

    private static final WebFilterChain EMPTY_WEB_FILTER_CHAIN = serverWebExchange -> Mono.empty();

    public Mono<User> signup(User user, ServerWebExchange exchange) {
        return Mono
                .zip(
                        userService.createUserAndSendEmail(user, exchange.getRequest().getHeaders().getOrigin()),
                        exchange.getSession(),
                        ReactiveSecurityContextHolder.getContext()
                )
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR)))
                .flatMap(tuple -> {
                    final User savedUser = tuple.getT1();
                    final WebSession session = tuple.getT2();
                    final SecurityContext securityContext = tuple.getT3();

                    Authentication authentication = new UsernamePasswordAuthenticationToken(savedUser, null, savedUser.getAuthorities());
                    securityContext.setAuthentication(authentication);
                    session.getAttributes().put(DEFAULT_SPRING_SECURITY_CONTEXT_ATTR_NAME, securityContext);

                    final WebFilterExchange webFilterExchange = new WebFilterExchange(exchange, EMPTY_WEB_FILTER_CHAIN);
                    return authenticationSuccessHandler
                            .onAuthenticationSuccess(webFilterExchange, authentication)
                            .thenReturn(savedUser);
                });
    }

}