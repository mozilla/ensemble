Ensemble is a work in progress. It is not ready for production use, but an
[example dashboard](http://moz-ensemble.herokuapp.com/dashboard/hardware/) is
available as a proof of concept.

Ensemble is a minimalist platform for publishing data dashboards. Ensemble is to
data what [Read the Docs](https://readthedocs.org/) is to developer
documentation.

Creating an Ensemble dashboard will be easy. Publish your data anywhere in our
standard JSON format ([example](public/dashboards/example/data.json)) and
register it with this service. That's it.

Ensemble explicitly aims not to be highly-configurable. Our goal is not to
support every feature imaginable, but instead to build a minimalist platform for
publishing useful visualizations quickly and easily. Right now, the need for
*more dashboards* outweighs the need for *perfect dashboards*.

Ensemble will offer all of the customization that data scientists need, but no
more. Custom sections, chart types, axes, and labels will be supported, for
example. It will be possible to export and save charts. Other features with
obvious value will be added. But will we [adopt a feature](https://gettingreal.37signals.com/ch05_Start_With_No.php)
that only one or two people truly need? Probably not.

[Software developers have more ideas than users have needs](https://blog.openjck.com/less-is-more/),
so this trade-off between elegance and scope is unavoidable. Saying no is hard,
but it's necessary to build a maintainable product that large numbers of people
actually want to use.

Ensemble's target audience is the long tail of organizations and teams that want
to publish something rather than nothing. Those with highly-specialized or
unique problems likely also have the resources to build their own dashboards. We
encourage them to do so and look forward to learning from one another.
