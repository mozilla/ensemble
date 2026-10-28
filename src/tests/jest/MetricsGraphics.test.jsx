import { render } from '@testing-library/react';
import MG from 'metrics-graphics';

import MetricsGraphics from '../../components/views/MetricsGraphics';


vi.mock('metrics-graphics', () => ({ default: { data_graphic: vi.fn() } }));

beforeEach(() => {
    MG.data_graphic.mockClear();
});

it('A redraw with the same data and a new size is not animated', () => {
    const data = [[{ x: 1, y: 2 }]];
    const { rerender } = render(<MetricsGraphics data={data} width={900} />);

    rerender(<MetricsGraphics data={data} width={700} />);

    expect(MG.data_graphic.mock.calls.at(-1)[0]).toMatchObject({ width: 700, transition_on_update: false });
});

it('A redraw with new data keeps the metrics-graphics line animation', () => {
    const { rerender } = render(<MetricsGraphics data={[[{ x: 1, y: 2 }]]} width={900} />);

    rerender(<MetricsGraphics data={[[{ x: 1, y: 5 }]]} width={900} />);

    expect(MG.data_graphic.mock.calls.at(-1)[0]).not.toHaveProperty('transition_on_update');
});

it('The chart is drawn into its own element', () => {
    const { container } = render(<MetricsGraphics data={[[{ x: 1, y: 2 }]]} />);

    expect(MG.data_graphic.mock.calls.at(-1)[0].target).toBe(container.querySelector('.metricsGraphicsCon'));
});
