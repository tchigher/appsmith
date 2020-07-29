import React, { useEffect } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import copy from "copy-to-clipboard";
import TagListField from "components/editorComponents/form/fields/TagListField";
import { reduxForm, SubmissionError } from "redux-form";
import SelectField from "components/editorComponents/form/fields/SelectField";
import Button from "components/editorComponents/Button";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getDefaultRole,
  getRolesForField,
  getAllUsers,
  getCurrentOrg,
} from "selectors/organizationSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { InviteUsersToOrgFormValues, inviteUsersToOrg } from "./helpers";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";
import { Classes } from "@blueprintjs/core";
import FormMessage from "components/editorComponents/form/FormMessage";
import {
  INVITE_USERS_SUBMIT_SUCCESS,
  INVITE_USERS_VALIDATION_EMAILS_EMPTY,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
  INVITE_USERS_VALIDATION_ROLE_EMPTY,
} from "constants/messages";
import history from "utils/history";
import { Colors } from "constants/Colors";
import { isEmail } from "utils/formhelpers";
import { StyledSwitch } from "components/propertyControls/StyledControls";
import Spinner from "components/editorComponents/Spinner";
import Divider from "components/editorComponents/Divider";
import { getDefaultPageId } from "sagas/SagaUtils";
import { getApplicationViewerPageURL } from "constants/routes";

const ShareWithPublicOption = styled.div`
   {
    display: flex;
    padding: 10px 0px;
    justify-content: space-between;
  }
`;

const ShareTitle = styled.div`
  font-size: ${props => props.theme.fontSizes[4]}px;
  font-weight: bold;
  padding-bottom: 10px;
`;

const ShareToggle = styled.div`
   {
    &&& label {
      margin-bottom: 0px;
    }
    &&& div {
      margin-right: 5px;
    }
    display: flex;
  }
`;

const OrgInviteTitle = styled.div`
  font-weight: bold;
  padding: 10px 0px;
`;

const StyledForm = styled.form`
  width: 100%;
  background: white;
  padding: ${props => props.theme.spaces[5]}px;
  &&& {
    .bp3-input {
      width: calc(100vh - 285px);
      box-shadow: none;
    }
  }
  .manageUsers {
    float: right;
    margin-top: 20px;
  }
`;
const StyledInviteFieldGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .wrapper {
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    padding-right: 5px;
    border-width: 1px;
    border-right: 0px;
    border-style: solid;
    border-color: ${Colors.ATHENS_GRAY};
  }
`;

const UserList = styled.div`
  max-height: 200px;
  margin-top: 20px;
  overflow-y: scroll;
  .user {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 8px;
    margin-bottom: 8px;
  }
`;

const StyledButton = styled(Button)`
  &&&.${Classes.BUTTON} {
    width: 83px;
    height: 41px;
    border-radius: 0px;
  }
`;

const validateFormValues = (values: { users: string; role: string }) => {
  if (values.users && values.users.length > 0) {
    const _users = values.users.split(",").filter(Boolean);

    _users.forEach(user => {
      if (!isEmail(user)) {
        throw new SubmissionError({
          _error: INVITE_USERS_VALIDATION_EMAIL_LIST,
        });
      }
    });
  } else {
    throw new SubmissionError({ _error: INVITE_USERS_VALIDATION_EMAILS_EMPTY });
  }

  if (values.role === undefined || values.role?.trim().length === 0) {
    throw new SubmissionError({ _error: INVITE_USERS_VALIDATION_ROLE_EMPTY });
  }
};

const validate = (values: any) => {
  const errors: any = {};
  if (!(values.users && values.users.length > 0)) {
    errors["users"] = INVITE_USERS_VALIDATION_EMAILS_EMPTY;
  }

  if (values.role === undefined || values.role?.trim().length === 0) {
    errors["role"] = INVITE_USERS_VALIDATION_ROLE_EMPTY;
  }

  return errors;
};

const InviteUsersForm = (props: any) => {
  const {
    handleSubmit,
    allUsers,
    submitting,
    anyTouched,
    submitFailed,
    submitSucceeded,
    error,
    fetchUser,
    fetchAllRoles,
    valid,
    onCancel,
    isFetchingApplication,
    isChangingViewAccess,
    currentApplicationDetails,
    changeAppViewAccess,
    applicationId,
    fetchCurrentOrg,
    currentOrg,
  } = props;

  const currentPath = useLocation().pathname;
  const pathRegex = /(?:\/org\/)\w+(?:\/settings)/;

  useEffect(() => {
    fetchUser(props.orgId);
    fetchAllRoles(props.orgId);
    fetchCurrentOrg(props.orgId);
  }, [props.orgId, fetchUser, fetchAllRoles, fetchCurrentOrg]);

  const defaultPageId = getDefaultPageId(currentApplicationDetails.pages);
  const viewApplicationURL = getApplicationViewerPageURL(
    applicationId,
    defaultPageId,
  );

  return (
    <>
      {applicationId && (
        <>
          <ShareWithPublicOption>
            <div>
              <ShareTitle>Share a link to this application.</ShareTitle>
              <ShareToggle>
                {currentApplicationDetails && (
                  <StyledSwitch
                    onChange={() => {
                      changeAppViewAccess(
                        applicationId,
                        !currentApplicationDetails.isPublic,
                      );
                    }}
                    disabled={isChangingViewAccess || isFetchingApplication}
                    checked={currentApplicationDetails.isPublic}
                    large
                  />
                )}
                Allow access without login
                {(isChangingViewAccess || isFetchingApplication) && (
                  <Spinner size={20} />
                )}
              </ShareToggle>
            </div>
            <Button
              size="large"
              text="Copy Link"
              filled
              icon={"duplicate"}
              intent="primary"
              onClick={() => {
                copy(
                  `${window.location.origin.toString()}${viewApplicationURL}`,
                );
              }}
            />
          </ShareWithPublicOption>
          <Divider />
          <OrgInviteTitle>Invite Users to {currentOrg?.name} </OrgInviteTitle>
        </>
      )}

      <StyledForm
        onSubmit={handleSubmit((values: any, dispatch: any) => {
          validateFormValues(values);
          return inviteUsersToOrg({ ...values, orgId: props.orgId }, dispatch);
        })}
      >
        {submitSucceeded && (
          <FormMessage intent="primary" message={INVITE_USERS_SUBMIT_SUCCESS} />
        )}
        {submitFailed && error && (
          <FormMessage intent="danger" message={error} />
        )}
        <StyledInviteFieldGroup>
          <div className="wrapper">
            <TagListField
              name="users"
              placeholder="Enter email address"
              type="email"
              label="Emails"
              intent="success"
              data-cy="t--invite-email-input"
            />
            <SelectField
              name="role"
              placeholder="Select a role"
              options={props.roles}
              size="large"
              outline={false}
              data-cy="t--invite-role-input"
            />
          </div>
          <StyledButton
            className="t--invite-user-btn"
            disabled={!valid}
            text="Invite"
            filled
            intent="primary"
            loading={submitting && !(submitFailed && !anyTouched)}
            type="submit"
          />
        </StyledInviteFieldGroup>
        <UserList style={{ justifyContent: "space-between" }}>
          {allUsers.map((user: { username: string; roleName: string }) => {
            return (
              <div className="user" key={user.username}>
                <div>{user.username}</div>
                <div>{user.roleName}</div>
              </div>
            );
          })}
        </UserList>
        <Button
          className="manageUsers"
          text="Manage Users"
          filled
          intent="primary"
          onClick={() => {
            pathRegex.test(currentPath)
              ? onCancel()
              : history.push(`/org/${props.orgId}/settings`);
          }}
        />
      </StyledForm>
    </>
  );
};

export default connect(
  (state: AppState) => {
    return {
      roles: getRolesForField(state),
      defaultRole: getDefaultRole(state),
      allUsers: getAllUsers(state),
      currentOrg: getCurrentOrg(state),
      currentApplicationDetails: state.ui.applications.currentApplication,
      isFetchingApplication: state.ui.applications.isFetchingApplication,
      isChangingViewAccess: state.ui.applications.isChangingViewAccess,
    };
  },
  (dispatch: any) => ({
    fetchAllRoles: (orgId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_ROLES_INIT,
        payload: {
          orgId,
        },
      }),
    fetchCurrentOrg: (orgId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_CURRENT_ORG,
        payload: {
          orgId,
        },
      }),
    fetchUser: (orgId: string) =>
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
        payload: {
          orgId,
        },
      }),
    changeAppViewAccess: (applicationId: string, publicAccess: boolean) =>
      dispatch({
        type: ReduxActionTypes.CHANGE_APPVIEW_ACCESS_INIT,
        payload: {
          applicationId,
          publicAccess,
        },
      }),
  }),
)(
  reduxForm<
    InviteUsersToOrgFormValues,
    {
      fetchAllRoles: (orgId: string) => void;
      roles?: any;
      applicationId?: string;
    }
  >({
    validate,
    form: INVITE_USERS_TO_ORG_FORM,
  })(InviteUsersForm),
);
