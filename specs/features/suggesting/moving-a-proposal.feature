@feature:suggesting-moving
Feature: Moving a proposal

  A proposal is on the page but not in the book, and it is still a line you can
  take hold of. The model puts each one where it thinks it belongs and is
  sometimes wrong about that, so it is moved the same way anything else is —
  by its handle, or with the arrow keys. See `../recipes/reordering.feature`.

  Nothing about moving one writes anything down. A proposal that has been
  dragged the length of the method is still a proposal, and closing the tab
  takes it with everything else that was never accepted.

  Background:
    Given the app is open
    And the AI is on
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"
    And "Apple pie" has the method:
      | Heat the oven to 180C |
      | Bake for 45 minutes   |

  @rule:proposal-can-be-moved
  Rule: A proposal is moved like any other line, before it is accepted

    Example: putting one where the model should have put it
      Given a model that drafts:
        | steps | 2 | Rub the butter into the flour |
      When I ask for a draft of "Apple pie"
      And I drag the step "Rub the butter into the flour" above "Bake for 45 minutes"
      Then the method reads:
        | Heat the oven to 180C         | mine     |
        | Rub the butter into the flour | proposed |
        | Bake for 45 minutes           | mine     |

    Example: moving it does not write it down
      Given a model that drafts:
        | steps | 2 | Rub the butter into the flour |
      When I ask for a draft of "Apple pie"
      And I drag the step "Rub the butter into the flour" above "Bake for 45 minutes"
      And I reload
      And I open the recipe "Apple pie"
      Then "Apple pie" shows the method:
        | Heat the oven to 180C |
        | Bake for 45 minutes   |

    Example: moved, then taken, and it stays where it was put
      Given a model that drafts:
        | steps | 2 | Rub the butter into the flour |
      When I ask for a draft of "Apple pie"
      And I drag the step "Rub the butter into the flour" above "Bake for 45 minutes"
      And I accept the proposal "Rub the butter into the flour"
      Then "Apple pie" shows the method:
        | Heat the oven to 180C         |
        | Rub the butter into the flour |
        | Bake for 45 minutes           |
