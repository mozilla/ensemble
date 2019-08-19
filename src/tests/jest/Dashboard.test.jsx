import Dashboard from '../../components/views/Dashboard';


let requiredProps;

beforeAll(() => {
    requiredProps = {
        metrics: [],
        regions: [],
    };
});

it('When a description prop is present, p#dashboard-description is rendered', () => {
    const d = shallow(
        <Dashboard
            {...requiredProps}
            description="Example description"
        />
    );

    expect(d.find('#dashboard-description').exists()).toEqual(true);
});

it('When a description prop is not present, an empty string, undefined, or null, p#dashboard-description is not rendered', () => {
    const d1 = shallow(
        <Dashboard
            {...requiredProps}
        />
    );

    const d2 = shallow(
        <Dashboard
            {...requiredProps}
            description={''}
        />
    );

    const d3 = shallow(
        <Dashboard
            {...requiredProps}
            description={undefined}
        />
    );

    const d4 = shallow(
        <Dashboard
            {...requiredProps}
            description={null}
        />
    );

    expect(d1.find('#dashboard-description').exists()).toEqual(false);
    expect(d2.find('#dashboard-description').exists()).toEqual(false);
    expect(d3.find('#dashboard-description').exists()).toEqual(false);
    expect(d4.find('#dashboard-description').exists()).toEqual(false);
});
