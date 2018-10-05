import React from 'react';

import Application from '../views/Application';
import URLManager from '../../lib/urlManager';
import dashboards from '../../config/dashboards.json';


export default class extends React.Component {
    constructor(props) {
        super(props);

        // These dashboards do not support custom regions
        this.regionlessDashboards = dashboards.sections.reduce((acc, section) => {
            if (section.members) {
                section.members.forEach(member => {
                    if (member.multipleRegions === false) {
                        acc.push(member.key);
                    }
                });
            }
            return acc;
        }, []);

        // The preferred region is the region that is being applied to the
        // current dashboard. If the current dashboard does not support regions
        // or if a dashboard is not currently loaded, the user's preferred
        // region might have been recorded in session storage instead.
        this.state = {
            preferredRegion: URLManager.getQueryParameter('region') || sessionStorage.getItem('region'),
        };

        // Update state, which in turns re-renders header links, whenever the
        // region changes
        const root = document.getElementById('root');
        root.addEventListener('regionChanged', () => {
            this.setState({
                preferredRegion: URLManager.getQueryParameter('region') || sessionStorage.getItem('region'),
            });
        }, false);
    }

    render() {
        return (
            <Application
                regionlessDashboards={this.regionlessDashboards}
                preferredRegion={this.state.preferredRegion}
            />
        );
    }
}
