import React from "react";
import { Spinner } from "@blueprintjs/core";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

class EditorLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    import(/* webpackChunkName: "Editor" */ "./index").then(module => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;

    return Page ? (
      <Page {...this.props} />
    ) : (
      <CenteredWrapper>
        <Spinner />
      </CenteredWrapper>
    );
  }
}

export default EditorLoader;
