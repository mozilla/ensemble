import json

from collections import Iterable
from numbers import Number


def _is_dict_w_strings(value, expected_keys):
    """
    Returns True if value is a dictionary containing exactly the set of
    expected keys, and all string values, False otherwise.
    """
    if not isinstance(value, dict):
        return False
    if len(value) != len(expected_keys):
        return False
    for key in expected_keys:
        if key not in value:
            return False
    for v in value.values():
        if not ininstance(v, basestring):
            return False
    return True


def _is_point(value):
    """
    Returns True if value is a 2-tuple of numeric values, False otherwise.
    """
    if not isinstance(value, tuple):
        return False
    if len(value) != 2:
        return False
    for v in value:
        if not isinstance(v, Number):
            return False
    return True


class Chart(object):
    """
    Data accumulator and JSON renderer for Ensemble's 'chart' entity.
    """
    def __init__(self, name, title="", desc="", section="", units=None,
                 labels=None):
        """
        Raises TypeError when any arguments are of the wrong type or format.
        """
        args = locals()
        for arg in ["name", "title", "desc", "section"]:
            if not isinstance(args[arg], basestring):
                err_msg = "Argument '%s' must be a string" % arg
                raise TypeError(err_msg)
        self.name = name
        self.title = title
        self.desc = desc
        self.section = section
        if units is not None:
            self.set_units(units)
        if labels is not None:
            self.set_labels(labels)
        self.data = []

    def set_units(self, units):
        """
        Raises TypeError if units is not a dict w 'x', 'y' as keys and string
        values.
        """
        if not _is_dict_w_strings(units, ["x", "y"]):
            err_msg = "'set_units' only accepts dicts of format " + \
                      "`{'x': <string_value>, 'y': <string_value>}`"
            raise TypeError(err_msg)
        self.units = units

    def set_labels(self, labels):
        """
        Raises TypeError if labels is not a dict w 'x', 'y' as keys and string
        values.
        """
        if not _is_dict_w_strings(labels, ["x", "y"]):
            err_msg = "'set_labels' only accepts dicts of format " + \
                      "`{'x': <string_value>, 'y': <string_value>}`"
            raise TypeError(err_msg)
        self.labels = labels

    def add_point(self, point):
        """
        Accepts a single 2-tuple of numeric values and appends it to the
        chart's set of data points. Raises TypeError if point is not a 2-tuple
        of numeric values.
        """
        if not _is_point(point):
            raise TypeError("'point' must be a 2-tuple of numeric values")
        self.data.append(point)

    def add_points(self, points):
        """
        Accepts a list (or other iterable) of point values and appends them to
        the chart's set of data points. Raises TypeError if points is not an
        iterable value containing only numeric 2-tuples.
        """
        err_msg = "'points' must be an iterable value containing " + \
                  "2-tuples of numeric values"
        if not isinstance(points, Iterable):
            raise TypeError(err_msg)
        for p in points:
            if not _is_point(p):
                raise TypeError(err_msg)
        self.data.extend(points)

    def _get_prerender(self):
        """
        Returns the 'prerender' dict that is one `json.dumps` call away from
        being the rendered JSON string for this chart.
        """
        pre = {"title": self.title or self.name}
        if self.desc:
            pre["description"] = self.desc
        if self.section:
            pre["section"] = self.section
        if self.units:
            pre["units"] = self.units
        if self.labels:
            pre["labels"] = self.labels
        data = []
        for v in self.data:
            data.append({"x": v[0], "y": v[1]})
        pre["data"] = data
        return pre

    def render_json(self):
        """
        Returns an Ensemble-formatted JSON string rendering of the chart data.
        """
        pre = self._get_prerender()
        return json.dumps(pre)


class Report(object):
    """
    Data accumulator and JSON renderer for Ensemble's 'report' entity, a
    collection of charts.
    """
    def __init__(self, name, title="", desc="", sections=None):
        """
        Raises TypeError when any arguments are of the wrong type or format.
        """
        args = locals()
        for arg in ["name", "title", "desc"]:
            if not isinstance(args[arg], basestring):
                err_msg = "Argument '%s' must be a string" % arg
                raise TypeError(err_msg)
        self.name = name
        self.title = title
        self.desc = desc
        self.sections = []
        if sections is not None:
            self.set_sections(sections)
        self.charts = []

    def add_section(self, section):
        """
        Appends specified section to the sections list. Raises TypeError if
        section is not a dict w 'key' and 'title' keys and string
        values. Raises ValueError if a section with the specified 'key' value
        already exists.
        """
        if not _is_dict_w_strings(section, ["key", "title"]):
            err_msg = "'set_sections' only accepts dicts of format " + \
                      "`{'key': <string_value>, 'title': <string_value>}`"
            raise TypeError(err_msg)
        this_key = section["key"]
        for existing in self.sections:
            # This is a nested loop when called from 'set_sections', but I'm
            # guessing there will never be enough sections for this to be much
            # of a problem.
            if existing["key"] == this_key:
                err_msg = ("Section with 'key' value of '%s' already exists" %
                           this_key)
                raise ValueError(err_msg)
        self.sections.append(section)

    def set_sections(self, sections):
        """
        Raises TypeError if sections is not an iterable containing only dicts w
        'key' and 'title' values.
        """
        if not isinstance(sections, Iterable):
            raise TypeError("'sections' argument must be iterable")
        for section in sections:
            self.add_section(section)

    def add_chart(self, chart):
        """
        Appends provided chart object to this report's charts list. Raises
        TypeError if the argument is not an instance of the Chart class.
        """
        if not isinstance(chart, Chart):
            raise TypeError("'chart' must be an instance of the Chart class.")
        self.charts.append(chart)

    def render_json(self):
        pre = {"title": self.title or self.name}
        if self.desc:
            pre["description"] = self.desc
        if self.sections:
            pre["sections"] = self.sections
        charts = []
        for chart in self.charts:
            charts.append(chart._get_prerender())
        pre["charts"] = charts
        return json.dumps(pre)

