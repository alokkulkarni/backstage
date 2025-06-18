import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
} from '@backstage/core-components';
import { EnvironmentsComponent } from '../EnvironmentsComponent';

export const EnvironmentsPage = () => (
  <Page themeId="tool">
    <Header title="Ephemeral Environments" subtitle="Manage your ephemeral environments">
      <SupportButton>
        This plugin allows you to manage GitHub issues tagged as environments and perform
        actions on them, like destroying an environment by triggering a GitHub workflow.
      </SupportButton>
    </Header>
    <Content>
      <ContentHeader title="Environments" />
      <EnvironmentsComponent />
    </Content>
  </Page>
);
