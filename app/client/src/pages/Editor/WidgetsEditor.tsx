import React, { useEffect, ReactNode, memo } from "react";
import { connect, useSelector } from "react-redux";
import styled from "styled-components";
import Canvas from "./Canvas";
import { AppState } from "reducers";
import { WidgetProps } from "widgets/BaseWidget";
import {
  getIsFetchingPage,
  getCurrentPageId,
  getCanvasWidgetDsl,
  getCurrentPageName,
} from "selectors/editorSelectors";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import { Spinner } from "@blueprintjs/core";
import { useWidgetSelection } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as log from "loglevel";
import { getCanvasClassName } from "utils/generators";
import { flashElementById } from "utils/helpers";

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
  height: calc(100vh - ${props => props.theme.headerHeight});
`;

const CanvasContainer = styled.section`
  height: 100%;
  width: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
`;

type EditorProps = {
  widgets?: ContainerWidgetProps<WidgetProps>;
  currentPageId?: string;
  isFetchingPage: boolean;
  currentPageName?: string;
};

/* eslint-disable react/display-name */
const WidgetsEditor = (props: EditorProps) => {
  const { focusWidget, selectWidget } = useWidgetSelection();
  const widgets = useSelector(getCanvasWidgetDsl);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  useEffect(() => {
    if (
      props.currentPageName !== undefined &&
      props.currentPageId !== undefined
    ) {
      AnalyticsUtil.logEvent("PAGE_LOAD", {
        pageName: props.currentPageName,
        pageId: props.currentPageId,
        mode: "EDIT",
      });
    }
  }, [props.currentPageName, props.currentPageId]);

  useEffect(() => {
    if (!props.isFetchingPage && window.location.hash.length > 0) {
      const widgetIdFromURLHash = window.location.hash.substr(1);
      flashElementById(widgetIdFromURLHash);
      selectWidget(widgetIdFromURLHash);
    }
  }, [props.isFetchingPage, selectWidget]);

  const handleWrapperClick = () => {
    focusWidget && focusWidget();
    selectWidget && selectWidget();
  };

  const pageLoading = (
    <Centered>
      <Spinner />
    </Centered>
  );
  let node: ReactNode;
  if (props.isFetchingPage) {
    node = pageLoading;
  }
  if (!props.isFetchingPage && props.widgets) {
    node = <Canvas dsl={props.widgets} />;
  }
  log.debug("Canvas rendered");
  return (
    <EditorContextProvider>
      <EditorWrapper onClick={handleWrapperClick}>
        <CanvasContainer
          key={props.currentPageId}
          className={getCanvasClassName()}
        >
          {node}
        </CanvasContainer>
      </EditorWrapper>
    </EditorContextProvider>
  );
};

const mapStateToProps = (state: AppState) => {
  return {
    widgets: getCanvasWidgetDsl(state),
    isFetchingPage: getIsFetchingPage(state),
    currentPageId: getCurrentPageId(state),
    currentPageName: getCurrentPageName(state),
  };
};

WidgetsEditor.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default connect(mapStateToProps)(WidgetsEditor);
