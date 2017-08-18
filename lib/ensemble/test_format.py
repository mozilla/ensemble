import unittest

from format import _is_dict_w_strings
from format import _is_point
from format import Chart
from format import Report


class IsFunctionTests(unittest.TestCase):
    def test_is_dict_w_strings(self):
        # Not a dict
        self.assertFalse(_is_dict_w_strings("foo", None))

        # Dict w keys too short
        value = {"a": "a", "b": "b", "c": "c"}
        self.assertFalse(_is_dict_w_strings(value, ["a", "b"]))

        # Dict w keys too long
        value = {"a": "a", "b": "b"}
        self.assertFalse(_is_dict_w_strings(value, ["a", "b", "c"]))

        # Dict w wrong keys
        self.assertFalse(_is_dict_w_strings(value, ["b", "c"]))

        # Dict w matching keys
        self.assertTrue(_is_dict_w_strings(value, ["a", "b"]))

        # Dict w matching keys different order
        self.assertTrue(_is_dict_w_strings(value, ["b", "a"]))

        # Dict w matching keys, values not strings
        value = {"a": 1, "b": 2}
        self.assertFalse(_is_dict_w_strings(value, ["a", "b"]))

    def test_is_point(self):
        # Not a tuple
        self.assertFalse(_is_point([1, 2]))

        # Not numbers
        self.assertFalse(_is_point(("a", "b")))

        # Wrong length
        self.assertFalse(_is_point((1, 2, 3)))

        # Just right
        self.assertTrue(_is_point((1, 2)))


class ChartTests(unittest.TestCase):
    output = '''{"data": [{"x": 256, "y": 43.8}, {"x": 512, "y": 21.2}, {"x": 1024, "y": 31.4}, {"x": 2048, "y": 3.6}], "description": "The amount of memory the graphics card has", "labels": {"x": "Memory", "y": ""}, "section": "gfx", "title": "Memory", "units": {"x": "MB", "y": "%"}}'''

    def test_init_failures(self):
        # string args aren't strings
        with self.assertRaises(TypeError):
            Chart(1, "title", "desc", "section")
        with self.assertRaises(TypeError):
            Chart("name", 1, "desc", "section")
        with self.assertRaises(TypeError):
            Chart("name", "title", 1, "section")
        with self.assertRaises(TypeError):
            Chart("name", "title", "desc", 1)

        # units not strings
        with self.assertRaises(TypeError):
            Chart("name", units={"x": 1, "y": 2})

        # units wrong keys
        with self.assertRaises(TypeError):
            Chart("name", units={"y": "units", "z": "units"})

        # units extra value
        with self.assertRaises(TypeError):
            Chart("name", units={"x": "a", "y": "b", "z": "c"})

        # labels not strings
        with self.assertRaises(TypeError):
            Chart("name", labels={"x": 1, "y": 2})

        # labels wrong keys
        with self.assertRaises(TypeError):
            Chart("name", labels={"y": "label1", "z": "label2"})

        # labels extra value
        with self.assertRaises(TypeError):
            Chart("name", labels={"x": "a", "y": "b", "z": "c"})

    def test_output_add_point(self):
        chart = Chart("memory", "Memory",
                      "The amount of memory the graphics card has", "gfx",
                      {"x": "MB", "y": "%"}, {"x": "Memory", "y": ""})
        chart.add_point((256, 43.8))
        chart.add_point((512, 21.2))
        chart.add_point((1024, 31.4))
        chart.add_point((2048, 3.6))
        output = chart.render_json()
        self.assertEqual(output, self.output)

    def test_output_add_points(self):
        chart = Chart("memory", "Memory",
                      "The amount of memory the graphics card has", "gfx",
                      {"x": "MB", "y": "%"}, {"x": "Memory", "y": ""})
        chart.add_points([(256, 43.8), (512, 21.2), (1024, 31.4), (2048, 3.6)])
        output = chart.render_json()
        self.assertEqual(output, self.output)


class ReportTests(unittest.TestCase):
    output = '''{"charts": [{"data": [{"x": 0, "y": 33.8}, {"x": 32, "y": 0.8}, {"x": 64, "y": 1.2}, {"x": 128, "y": 3.6}, {"x": 256, "y": 5.3}, {"x": 512, "y": 12.2}, {"x": 1024, "y": 24.7}, {"x": 2048, "y": 18.4}], "description": "The number of processors in a graphics card", "section": "gfx", "title": "Stream processors", "units": {"x": "count", "y": "%"}}, {"data": [{"x": 256, "y": 43.8}, {"x": 512, "y": 21.2}, {"x": 1024, "y": 31.4}, {"x": 2048, "y": 3.6}], "description": "The amount of memory the graphics card has", "labels": {"x": "Memory", "y": ""}, "section": "gfx", "title": "Memory", "units": {"x": "MB", "y": "%"}}, {"data": [{"x": 1, "y": 73.8}, {"x": 2, "y": 24.3}, {"x": 4, "y": 1.4}, {"x": 8, "y": 0.5}], "description": "The number of cores the CPU has", "section": "cpu", "title": "Number of cores", "units": {"x": "count", "y": "%"}}], "description": "Statistics about audio, graphics, and CPU hardware", "sections": [{"key": "gfx", "title": "Graphics"}, {"key": "cpu", "title": "CPU"}], "title": "Hardware"}'''

    def test_init_failures(self):
        # string args aren't strings
        with self.assertRaises(TypeError):
            Report(1, "title", "desc")
        with self.assertRaises(TypeError):
            Report("name", 1, "desc")
        with self.assertRaises(TypeError):
            Report("name", "title", 1)

        # sections isn't iterable
        with self.assertRaises(TypeError):
            Report("name", sections=1)

        # sections contains a non-dict
        with self.assertRaises(TypeError):
            sections = [{"key": "k", "title": "t"}, ["k1", "t1"]]
            Report("name", sections=sections)

        # sections has an incorrectly structured section
        with self.assertRaises(TypeError):
            sections = [{"key": "k", "title": "t"}, {"k": "k1", "t": "t1"}]
            Report("name", sections=sections)

        # sections has a duplicate key
        with self.assertRaises(ValueError):
            sections = [{"key": "k", "title": "t"},
                        {"key": "k", "title": "t1"}]
            Report("name", sections=sections)

    def test_output(self):
        report = Report("hardware", "Hardware",
                        "Statistics about audio, graphics, and CPU hardware",
                        [{"key": "gfx", "title": "Graphics"},
                         {"key": "cpu", "title": "CPU"}])

        chart0 = Chart("stream_processors", "Stream processors",
                       "The number of processors in a graphics card", "gfx",
                       {"x": "count", "y": "%"})
        chart0.add_points([(0, 33.8), (32, 0.8), (64, 1.2), (128, 3.6),
                           (256, 5.3), (512, 12.2), (1024, 24.7),
                           (2048, 18.4)])
        report.add_chart(chart0)

        chart1 = Chart("memory", "Memory",
                       "The amount of memory the graphics card has", "gfx",
                       {"x": "MB", "y": "%"}, {"x": "Memory", "y": ""})
        chart1.add_points([(256, 43.8), (512, 21.2), (1024, 31.4),
                           (2048, 3.6)])
        report.add_chart(chart1)

        chart2 = Chart("num_cores", "Number of cores",
                       "The number of cores the CPU has", "cpu",
                       {"x": "count", "y": "%"})
        chart2.add_points([(1, 73.8), (2, 24.3), (4, 1.4), (8, 0.5)])
        report.add_chart(chart2)
        output = report.render_json()
        self.assertEqual(output, self.output)


if __name__ == '__main__':
    unittest.main()
