import { Button, Grid } from '@material-ui/core';
import {
  EntityApiDefinitionCard,
  EntityConsumedApisCard,
  EntityConsumingComponentsCard,
  EntityHasApisCard,
  EntityProvidedApisCard,
  EntityProvidingComponentsCard,
} from '@backstage/plugin-api-docs';
import {
  EntityAboutCard,
  EntityDependsOnComponentsCard,
  EntityDependsOnResourcesCard,
  EntityHasComponentsCard,
  EntityHasResourcesCard,
  EntityHasSubcomponentsCard,
  EntityHasSystemsCard,
  EntityLayout,
  EntityLinksCard,
  EntitySwitch,
  EntityOrphanWarning,
  EntityProcessingErrorsPanel,
  isComponentType,
  isKind,
  hasCatalogProcessingErrors,
  isOrphan,
  hasRelationWarnings,
  EntityRelationWarning,
} from '@backstage/plugin-catalog';
import {
  EntityUserProfileCard,
  EntityGroupProfileCard,
  EntityMembersListCard,
  EntityOwnershipCard,
} from '@backstage/plugin-org';
import { EntityTechdocsContent } from '@backstage/plugin-techdocs';
import { EmptyState, TabbedLayout } from '@backstage/core-components';
import {
  Direction,
  EntityCatalogGraphCard,
} from '@backstage/plugin-catalog-graph';
import {
  RELATION_API_CONSUMED_BY,
  RELATION_API_PROVIDED_BY,
  RELATION_CONSUMES_API,
  RELATION_DEPENDENCY_OF,
  RELATION_DEPENDS_ON,
  RELATION_HAS_PART,
  RELATION_PART_OF,
  RELATION_PROVIDES_API,
} from '@backstage/catalog-model';

import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';

import {
  EntityGithubActionsContent,
  isGithubActionsAvailable,
} from '@backstage-community/plugin-github-actions';

import {
  EntityKubernetesContent,
  isKubernetesAvailable,
} from '@backstage/plugin-kubernetes';
import {
  isArgocdAvailable,
  EntityArgoCDOverviewCard,
} from '@roadiehq/backstage-plugin-argo-cd';
import {
  EntitySonarQubeCard,
  isSonarQubeAvailable,
} from '@backstage/plugin-sonarqube';

import { EntityGithubInsightsContent,
        EntityGithubInsightsLanguagesCard,
        EntityGithubInsightsReadmeCard,
        EntityGithubInsightsReleasesCard,
        isGithubInsightsAvailable,
 } from '@roadiehq/backstage-plugin-github-insights';

 import {
  EntityAzurePipelinesContent,
  isAzureDevOpsAvailable,
  isAzurePipelinesAvailable,
  EntityAzurePullRequestsContent,
  EntityAzureGitTagsContent,
  EntityAzureReadmeCard,
} from '@backstage-community/plugin-azure-devops';

import { EntityGithubPullRequestsContent,EntityGithubPullRequestsOverviewCard } from '@roadiehq/backstage-plugin-github-pull-requests';
import { EntityLaunchdarklyContextOverviewCard, isLaunchdarklyContextAvailable, EntityLaunchdarklyProjectOverviewContent } from '@roadiehq/backstage-plugin-launchdarkly';
import {
  EntityCatalogInfoQueryCard,
  EntityDqlQueryCard,
  EntityKubernetesDeploymentsCard,
} from '@dynatrace/backstage-plugin-dql'; 

import {
  EntityJenkinsContent,
  EntityLatestJenkinsRunCard,
  isJenkinsAvailable,
} from '@backstage-community/plugin-jenkins';

const techdocsContent = (
  <EntityTechdocsContent>
    <TechDocsAddons>
      <ReportIssue />
    </TechDocsAddons>
  </EntityTechdocsContent>
);

const cicdContent = (
  <EntitySwitch>
    <EntitySwitch.Case if={isJenkinsAvailable}>
        <EntityJenkinsContent title="Jenkins build history"/>
    </EntitySwitch.Case>
    <EntitySwitch.Case if={isGithubActionsAvailable}>
      <Grid item xs={12}>
        <EntityGithubActionsContent />
      </Grid>  
    </EntitySwitch.Case>

    <EntitySwitch.Case>
      <EmptyState
        title="No CI/CD available for this entity"
        missing="info"
        description="You need to add an annotation to your component if you want to enable CI/CD for it. You can read more about annotations in Backstage by clicking the button below."
        action={
          <Button
            variant="contained"
            color="primary"
            href="https://backstage.io/docs/features/software-catalog/well-known-annotations"
          >
            Read more
          </Button>
        }
      />
    </EntitySwitch.Case>
    <EntitySwitch.Case if={isAzureDevOpsAvailable}>
        <EntityAzurePipelinesContent defaultLimit={25} />
    </EntitySwitch.Case>
    <EntitySwitch.Case if={isAzurePipelinesAvailable}>
        <EntityAzurePipelinesContent defaultLimit={25} />
    </EntitySwitch.Case>
  </EntitySwitch>
);

const codeQualityContent = (
  <EntitySwitch>
    <EntitySwitch.Case if={isSonarQubeAvailable}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntitySonarQubeCard />
        </Grid>
      </Grid>
    </EntitySwitch.Case>

    <EntitySwitch.Case>
      <EmptyState
        title="No SonarQube analysis available for this entity"
        missing="info"
        description="You need to add a sonarqube annotation to your component if you want to enable code quality metrics."
        action={
          <Button
            variant="contained"
            color="primary"
            href="https://backstage.io/docs/integrations/sonarqube/"
          >
            Read more
          </Button>
        }
      />
    </EntitySwitch.Case>
  </EntitySwitch>
);

const entityWarningContent = (
  <>
    <EntitySwitch>
      <EntitySwitch.Case if={isOrphan}>
        <Grid item xs={12}>
          <EntityOrphanWarning />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={hasRelationWarnings}>
        <Grid item xs={12}>
          <EntityRelationWarning />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={hasCatalogProcessingErrors}>
        <Grid item xs={12}>
          <EntityProcessingErrorsPanel />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </>
);

const overviewContent = (
  <Grid container spacing={3} alignItems="stretch">
    {entityWarningContent}
    <Grid item md={6}>
      <EntityAboutCard variant="gridItem" />
    </Grid>
    <Grid item md={6} xs={12}>
      <EntityCatalogGraphCard variant="gridItem" height={400} />
    </Grid>
    <Grid item md={6} xs={12}>
      <Grid item md={12} xs={12}>
        <EntityHasSubcomponentsCard variant="gridItem" />
      </Grid>
      <Grid item md={12} xs={12}>
        <EntityLinksCard />
      </Grid>
    </Grid>
    <Grid item md={6} xs={12}>
      <EntitySwitch>
        <EntitySwitch.Case if={e => Boolean(isGithubInsightsAvailable(e))}>
          <Grid item md={12} xs={12}>
            <EntityGithubInsightsLanguagesCard />
            <EntityGithubInsightsReleasesCard />
          </Grid>
        </EntitySwitch.Case>
      </EntitySwitch>
      <Grid item md={12} xs={12}>
          <EntityGithubPullRequestsOverviewCard />
      </Grid>
    </Grid>
    
    <Grid item md={6} xs={12}>
      <EntitySwitch.Case if={isJenkinsAvailable}>
          <Grid item sm={6}>
            <EntityLatestJenkinsRunCard
              branch="main,master"
              variant="gridItem"
              title="Latest production build"
            />
          </Grid>
        </EntitySwitch.Case>
    </Grid>

    <Grid item md={6} xs={12}>
      <EntitySwitch>
        <EntitySwitch.Case if={isLaunchdarklyContextAvailable}>
          <EntityLaunchdarklyContextOverviewCard />
        </EntitySwitch.Case>
      </EntitySwitch>
    </Grid>
  </Grid>
);

// Define a new Jira content section with all the Jira components
// Define ArgoCD content for reuse across entity pages
const argoCDContent = (
  <EntitySwitch>
    <EntitySwitch.Case if={isArgocdAvailable}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityArgoCDOverviewCard />
        </Grid>
      </Grid>
    </EntitySwitch.Case>

    <EntitySwitch.Case>
      <EmptyState
        title="No ArgoCD information for this entity"
        missing="info"
        description="This entity does not have the ArgoCD annotation. Please add the annotation to view ArgoCD information."
        action={
          <Button
            variant="contained"
            color="primary"
            href="https://roadie.io/backstage/plugins/argo-cd/"
          >
            Read more about the ArgoCD integration
          </Button>
        }
      />
    </EntitySwitch.Case>
  </EntitySwitch>
);

const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>
    <EntityLayout.Route if={e => Boolean(isGithubInsightsAvailable(e))} path="/readme" title="ReadME">
      <Grid item md={12}>
          <EntityGithubInsightsReadmeCard maxHeight={800} />
        </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/readme" title="ReadME">
      <Grid item md={12}>
          <EntityAzureReadmeCard maxHeight={800} />
        </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/definition" title="Definition">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityApiDefinitionCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    {/* <EntityLayout.Route path="/jira" title="Jira">
      {jiraContent}
    </EntityLayout.Route> */}
    <EntityLayout.Route path="/launch-darkly-projects" title="LaunchDarkly">
      <EntityLaunchdarklyProjectOverviewContent />
    </EntityLayout.Route>
    <EntityLayout.Route path="/code-insights" title="Code Insights">
      <EntityGithubInsightsContent />
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/pull-requests" title="Pull Requests">
      <Grid item md={6}>
        <EntityAzurePullRequestsContent defaultLimit={25} />
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route if={e => Boolean(isGithubInsightsAvailable(e))} path="/pull-requests" title="Pull Requests">
      <Grid item md={12}>
        <EntityGithubPullRequestsContent />
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/code-quality" title="Code Quality">
      {codeQualityContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/ci-cd" title="CI/CD">
      {cicdContent}
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/git-tags" title="Git Tags">
      <EntityAzureGitTagsContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/kubernetes" title="Kubernetes" if={isKubernetesAvailable}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <EntityKubernetesContent refreshIntervalMs={30000} />
        </Grid>
        <EntitySwitch>
          <EntitySwitch.Case if={isArgocdAvailable}>
            <Grid item xs={12} md={6}>
              <EntityArgoCDOverviewCard />
            </Grid>
          </EntitySwitch.Case>
        </EntitySwitch>
      </Grid>
    </EntityLayout.Route>
    
    <EntityLayout.Route path="/argocd" title="ArgoCD" if={isArgocdAvailable}>
      {argoCDContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/api" title="API">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityProvidedApisCard />
        </Grid>
        <Grid item md={6}>
          <EntityConsumedApisCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/dependencies" title="Dependencies">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityDependsOnComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityDependsOnResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    
    <EntityLayout.Route path="/dynatrace" title="Dynatrace">
      <TabbedLayout>
        <TabbedLayout.Route path="/kubernetes" title="Kubernetes Deployments">
          <EntityKubernetesDeploymentsCard title="Kubernetes Deployments with explicit title" />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/srg" title="Site Reliability Guardian">
          <EntityDqlQueryCard
            title="Site Reliability Guardian Validations"
            queryId="dynatrace.srg-validations"
          />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/davis-events" title="Davis Events">
          <EntityDqlQueryCard
            title="Davis Events"
            queryId="custom.davis-events"
          />
        </TabbedLayout.Route>
        <TabbedLayout.Route
          path="/example-catalog-queries"
          title="Example Catalog Queries"
        >
          <EntityCatalogInfoQueryCard />
        </TabbedLayout.Route>
      </TabbedLayout>
    </EntityLayout.Route>
    {/* <EntityLayout.Route path="/terraform-environments" title="Environments">
      <Grid item xs={12}>
        <TerraformEnvironmentsPage />
      </Grid>
    </EntityLayout.Route> */}
  </EntityLayout>
);

const websiteEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>
    <EntityLayout.Route if={e => Boolean(isGithubInsightsAvailable(e))} path="/readme" title="ReadME">
      <Grid item md={12}>
          <EntityGithubInsightsReadmeCard maxHeight={800} />
        </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/readme" title="ReadME">
      <Grid item md={12}>
          <EntityAzureReadmeCard maxHeight={800} />
        </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/definition" title="Definition">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityApiDefinitionCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    {/* <EntityLayout.Route path="/jira" title="Jira">
      {jiraContent}
    </EntityLayout.Route> */}
    <EntityLayout.Route path="/launch-darkly-projects" title="LaunchDarkly">
      <EntityLaunchdarklyProjectOverviewContent />
    </EntityLayout.Route>
    <EntityLayout.Route path="/code-insights" title="Code Insights">
      <EntityGithubInsightsContent />
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/pull-requests" title="Pull Requests">
      <Grid item md={6}>
        <EntityAzurePullRequestsContent defaultLimit={25} />
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route if={e => Boolean(isGithubInsightsAvailable(e))} path="/pull-requests" title="Pull Requests">
      <Grid item md={12}>
        <EntityGithubPullRequestsContent />
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/code-quality" title="Code Quality">
      {codeQualityContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/ci-cd" title="CI/CD">
      {cicdContent}
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/git-tags" title="Git Tags">
      <EntityAzureGitTagsContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/kubernetes" title="Kubernetes" if={isKubernetesAvailable}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <EntityKubernetesContent refreshIntervalMs={30000} />
        </Grid>
        <EntitySwitch>
          <EntitySwitch.Case if={isArgocdAvailable}>
            <Grid item xs={12} md={6}>
              <EntityArgoCDOverviewCard />
            </Grid>
          </EntitySwitch.Case>
        </EntitySwitch>
      </Grid>
    </EntityLayout.Route>
    
    <EntityLayout.Route path="/argocd" title="ArgoCD" if={isArgocdAvailable}>
      {argoCDContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/api" title="API">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityProvidedApisCard />
        </Grid>
        <Grid item md={6}>
          <EntityConsumedApisCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/dependencies" title="Dependencies">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityDependsOnComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityDependsOnResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    
    <EntityLayout.Route path="/dynatrace" title="Dynatrace">
      <TabbedLayout>
        <TabbedLayout.Route path="/kubernetes" title="Kubernetes Deployments">
          <EntityKubernetesDeploymentsCard title="Kubernetes Deployments with explicit title" />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/srg" title="Site Reliability Guardian">
          <EntityDqlQueryCard
            title="Site Reliability Guardian Validations"
            queryId="dynatrace.srg-validations"
          />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/davis-events" title="Davis Events">
          <EntityDqlQueryCard
            title="Davis Events"
            queryId="custom.davis-events"
          />
        </TabbedLayout.Route>
        <TabbedLayout.Route
          path="/example-catalog-queries"
          title="Example Catalog Queries"
        >
          <EntityCatalogInfoQueryCard />
        </TabbedLayout.Route>
      </TabbedLayout>
    </EntityLayout.Route>
    {/* <EntityLayout.Route path="/terraform-environments" title="Environments">
      <Grid item xs={12}>
        <TerraformEnvironmentsPage />
      </Grid>
    </EntityLayout.Route> */}
  </EntityLayout>
);

/**
 * NOTE: This page is designed to work on small screens such as mobile devices.
 * This is based on Material UI Grid. If breakpoints are used, each grid item must set the `xs` prop to a column size or to `true`,
 * since this does not default. If no breakpoints are used, the items will equitably share the available space.
 * https://material-ui.com/components/grid/#basic-grid.
 */

const defaultEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/dependencies" title="Dependencies">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityDependsOnComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityDependsOnResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const componentPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isComponentType('service')}>
      {serviceEntityPage}
    </EntitySwitch.Case>

    <EntitySwitch.Case if={isComponentType('website')}>
      {websiteEntityPage}
    </EntitySwitch.Case>

    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);

const apiPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={4} xs={12}>
          <EntityLinksCard />
        </Grid>
        <Grid container item md={12}>
          <Grid item md={6}>
            <EntityProvidingComponentsCard />
          </Grid>
          <Grid item md={6}>
            <EntityConsumingComponentsCard />
          </Grid>
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/definition" title="Definition">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <EntityApiDefinitionCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route if={e => Boolean(isGithubInsightsAvailable(e))} path="/readme" title="ReadME">
      <Grid item md={12}>
          <EntityGithubInsightsReadmeCard maxHeight={800} />
        </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/readme" title="ReadME">
      <Grid item md={12}>
          <EntityAzureReadmeCard maxHeight={800} />
        </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/docs" title="Docs">
      {techdocsContent}
    </EntityLayout.Route>
    {/* <EntityLayout.Route path="/jira" title="Jira">
      {jiraContent}
    </EntityLayout.Route> */}
    <EntityLayout.Route path="/launch-darkly-projects" title="LaunchDarkly">
      <EntityLaunchdarklyProjectOverviewContent />
    </EntityLayout.Route>
    <EntityLayout.Route path="/code-insights" title="Code Insights">
      <EntityGithubInsightsContent />
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/pull-requests" title="Pull Requests">
      <Grid item md={6}>
        <EntityAzurePullRequestsContent defaultLimit={25} />
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route if={e => Boolean(isGithubInsightsAvailable(e))} path="/pull-requests" title="Pull Requests">
      <Grid item md={12}>
        <EntityGithubPullRequestsContent />
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/code-quality" title="Code Quality">
      {codeQualityContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/ci-cd" title="CI/CD">
      {cicdContent}
    </EntityLayout.Route>
    <EntityLayout.Route if={isAzureDevOpsAvailable} path="/git-tags" title="Git Tags">
      <EntityAzureGitTagsContent />
    </EntityLayout.Route>

    <EntityLayout.Route path="/kubernetes" title="Kubernetes" if={isKubernetesAvailable}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <EntityKubernetesContent refreshIntervalMs={30000} />
        </Grid>
        <EntitySwitch>
          <EntitySwitch.Case if={isArgocdAvailable}>
            <Grid item xs={12} md={6}>
              <EntityArgoCDOverviewCard />
            </Grid>
          </EntitySwitch.Case>
        </EntitySwitch>
      </Grid>
    </EntityLayout.Route>
    
    <EntityLayout.Route path="/argocd" title="ArgoCD" if={isArgocdAvailable}>
      {argoCDContent}
    </EntityLayout.Route>
    <EntityLayout.Route path="/api" title="API">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityProvidedApisCard />
        </Grid>
        <Grid item md={6}>
          <EntityConsumedApisCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>

    <EntityLayout.Route path="/dependencies" title="Dependencies">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityDependsOnComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityDependsOnResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    
    <EntityLayout.Route path="/dynatrace" title="Dynatrace">
      <TabbedLayout>
        <TabbedLayout.Route path="/kubernetes" title="Kubernetes Deployments">
          <EntityKubernetesDeploymentsCard title="Kubernetes Deployments with explicit title" />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/srg" title="Site Reliability Guardian">
          <EntityDqlQueryCard
            title="Site Reliability Guardian Validations"
            queryId="dynatrace.srg-validations"
          />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/davis-events" title="Davis Events">
          <EntityDqlQueryCard
            title="Davis Events"
            queryId="custom.davis-events"
          />
        </TabbedLayout.Route>
        <TabbedLayout.Route
          path="/example-catalog-queries"
          title="Example Catalog Queries"
        >
          <EntityCatalogInfoQueryCard />
        </TabbedLayout.Route>
      </TabbedLayout>
    </EntityLayout.Route>
  </EntityLayout>
);

const userPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
        <Grid item xs={12} md={6}>
          <EntityUserProfileCard variant="gridItem" />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityOwnershipCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const groupPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3}>
        {entityWarningContent}
        <Grid item xs={12} md={6}>
          <EntityGroupProfileCard variant="gridItem" />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityOwnershipCard variant="gridItem" />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityMembersListCard />
        </Grid>
        <Grid item xs={12} md={6}>
          <EntityLinksCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

const systemPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} alignItems="stretch">
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard variant="gridItem" />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={4} xs={12}>
          <EntityLinksCard />
        </Grid>
        <Grid item md={8}>
          <EntityHasComponentsCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityHasApisCard variant="gridItem" />
        </Grid>
        <Grid item md={6}>
          <EntityHasResourcesCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/diagram" title="Diagram">
      <EntityCatalogGraphCard
        variant="gridItem"
        direction={Direction.TOP_BOTTOM}
        title="System Diagram"
        height={700}
        relations={[
          RELATION_PART_OF,
          RELATION_HAS_PART,
          RELATION_API_CONSUMED_BY,
          RELATION_API_PROVIDED_BY,
          RELATION_CONSUMES_API,
          RELATION_PROVIDES_API,
          RELATION_DEPENDENCY_OF,
          RELATION_DEPENDS_ON,
        ]}
        unidirectional={false}
      />
    </EntityLayout.Route>
  </EntityLayout>
);

const domainPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} alignItems="stretch">
        {entityWarningContent}
        <Grid item md={6}>
          <EntityAboutCard variant="gridItem" />
        </Grid>
        <Grid item md={6} xs={12}>
          <EntityCatalogGraphCard variant="gridItem" height={400} />
        </Grid>
        <Grid item md={6}>
          <EntityHasSystemsCard variant="gridItem" />
        </Grid>
      </Grid>
    </EntityLayout.Route>
  </EntityLayout>
);

export const entityPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('component')} children={componentPage} />
    <EntitySwitch.Case if={isKind('api')} children={apiPage} />
    <EntitySwitch.Case if={isKind('group')} children={groupPage} />
    <EntitySwitch.Case if={isKind('user')} children={userPage} />
    <EntitySwitch.Case if={isKind('system')} children={systemPage} />
    <EntitySwitch.Case if={isKind('domain')} children={domainPage} />

    <EntitySwitch.Case>{defaultEntityPage}</EntitySwitch.Case>
  </EntitySwitch>
);
