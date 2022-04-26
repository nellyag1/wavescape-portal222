// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web'
import { ReactPlugin, withAITracking } from '@microsoft/applicationinsights-react-js'
import { createBrowserHistory } from 'history';

const APP_INSIGHTS_CONNECTION_STRING = process.env.REACT_APP_APPLICATION_INSIGHTS_CONNECTION_STRING
const reactPlugin = new ReactPlugin();
const appInsights = new ApplicationInsights({
    config: {
        connectionString: APP_INSIGHTS_CONNECTION_STRING,
        extensions: [reactPlugin],
        extensionConfig: {
            [reactPlugin.identifier]: { history: createBrowserHistory }
        }
    }
})
appInsights.loadAppInsights();
appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/page-view
export { reactPlugin, appInsights, SeverityLevel, withAITracking };
