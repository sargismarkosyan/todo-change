@feature:todo-sub-todos
Feature: Sub-todos

  Some of what lands in the list is one thought with a few steps in it. A todo
  can hold a short list of sub-todos, so the steps stay together instead of
  scattering into separate lines that only Rowan knows are related.

  One flat level, and no more. Sub-todos are typed on their parent's own row, so
  the box at the top of the list keeps doing exactly one thing.

  Background:
    Given the app is open

  @rule:sub-todo-added-under-parent
  Rule: A sub-todo is typed on its parent's row and appears beneath it

    Example: adding the first sub-todo
      Given the list reads:
        | Sort out car insurance |
      When I add "Call current insurer" under "Sort out car insurance"
      Then "Sort out car insurance" has the sub-todos:
        | Call current insurer |

    Example: the parent stays where it was
      Given the list reads:
        | Water plants           |
        | Sort out car insurance |
      When I add "Call current insurer" under "Sort out car insurance"
      Then the list reads:
        | Water plants           |
        | Sort out car insurance |

  @rule:sub-todos-keep-typing-order
  Rule: Sub-todos stay in the order they were typed

    Example: three steps in sequence
      Given the list reads:
        | Sort out car insurance |
      When I add "Call current insurer" under "Sort out car insurance"
      And I add "Compare two quotes" under "Sort out car insurance"
      And I add "Cancel the old policy" under "Sort out car insurance"
      Then "Sort out car insurance" has the sub-todos:
        | Call current insurer  |
        | Compare two quotes    |
        | Cancel the old policy |

  @rule:sub-todo-rejects-blank
  Rule: Blank text does not become a sub-todo

    Example: submitting only spaces under a parent
      Given the list reads:
        | Sort out car insurance |
      When I submit "   " under "Sort out car insurance"
      Then "Sort out car insurance" has no sub-todos

  @rule:sub-todo-depth-is-one
  Rule: A sub-todo cannot have sub-todos of its own

    Example: there is no second level to reach for
      Given the list reads:
        | Sort out car insurance |
      And "Sort out car insurance" has the sub-todos:
        | Call current insurer |
      Then "Call current insurer" offers no way to add a sub-todo
