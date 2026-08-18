@feature:recipe-reordering-keyboard
Feature: Moving a line without a mouse

  Dragging is one way to hold a line, not the only one. The same handle takes
  keyboard focus, and the arrow keys move the line it belongs to — so a method
  can be put right by somebody who is not using a pointer, and by somebody whose
  pointer is not the thing they want to be using.

  It is the same control and the same result, which is the point: there is one
  handle per line and two ways to use it, rather than a set of arrows sitting
  beside a drag handle doing the same job twice.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"
    And "Apple pie" has the method:
      | Rub the butter into the flour |
      | Heat the oven to 190C         |
      | Bake for 45 minutes           |

  @planned @rule:line-moved-by-keyboard
  Rule: The arrow keys move the line whose handle has focus

    Example: lifting a step by one
      When I focus the handle of the step "Heat the oven to 190C"
      And I press the up arrow
      Then "Apple pie" shows the method:
        | Heat the oven to 190C         |
        | Rub the butter into the flour |
        | Bake for 45 minutes           |

    Example: pushing one down
      When I focus the handle of the step "Rub the butter into the flour"
      And I press the down arrow
      Then "Apple pie" shows the method:
        | Heat the oven to 190C         |
        | Rub the butter into the flour |
        | Bake for 45 minutes           |

    Example: the handle keeps focus, so it can be pressed again
      When I focus the handle of the step "Bake for 45 minutes"
      And I press the up arrow
      And I press the up arrow
      Then "Apple pie" shows the method:
        | Bake for 45 minutes           |
        | Rub the butter into the flour |
        | Heat the oven to 190C         |

  @planned @rule:the-ends-of-the-group-hold
  Rule: A line at the end of its group does not move past it

    Example: the first one cannot go higher
      When I focus the handle of the step "Rub the butter into the flour"
      And I press the up arrow
      Then "Apple pie" shows the method:
        | Rub the butter into the flour |
        | Heat the oven to 190C         |
        | Bake for 45 minutes           |

    Example: the last one cannot go lower
      When I focus the handle of the step "Bake for 45 minutes"
      And I press the down arrow
      Then "Apple pie" shows the method:
        | Rub the butter into the flour |
        | Heat the oven to 190C         |
        | Bake for 45 minutes           |

    Example: a group of one has nowhere to go
      Given "Apple pie" has the ingredients:
        | 3 apples |
      When I focus the handle of the ingredient "3 apples"
      And I press the up arrow
      Then "Apple pie" shows the ingredients:
        | 3 apples |
