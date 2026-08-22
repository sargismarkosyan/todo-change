@workflow:correct-a-line @persona:nell @journey:keeping-what-you-cook
Feature: Correct a line

  When a recipe was dictated out of order — "cream the butter and sugar, oh,
  and heat the oven first" — or a line simply ended up in the wrong place,
  I want that line moved to where it belongs,
  so the method reads in the order it happens.

  **Ends when** the order is right.

  **Why this is not tidying.** For the method it is a correctness fix, not a
  cosmetic one: the steps are numbered, so a step's position is part of what it
  says. A method in the wrong order is wrong in the same way a wrong quantity
  is wrong. Filing it under "tidy" alongside deleting a book — which the old
  `workflows.md` did — put a correction next to a destruction and made both
  harder to reason about.

  **Done well.** A line is taken hold of by its grip and dragged into place, or
  moved with the arrow keys. The same control either way, so nothing about this
  needs a mouse. Before 0010 the only fix was deleting every line after the
  mistake and typing them again.

  **A line moves within its group and nowhere else.** An ingredient does not
  become a step by being dragged far enough.

  **Where it breaks.** A line that does not follow the hand holding it. A page
  that reflows around the thing being moved. A drag that cannot be started from
  the keyboard, which makes the fix available only to one kind of hand — see
  `@guarantee:within-reach`.

  Example: a step dictated out of order is put first
    Given "Apple cake" has the method:
      | Cream the butter and sugar |
      | Heat the oven to 180C      |
    When I open the recipe "Apple cake"
    And I move the step "Heat the oven to 180C" up
    Then "Apple cake" has the method:
      | Heat the oven to 180C      |
      | Cream the butter and sugar |

  Example: the correction survives being closed
    Given "Apple cake" has the method:
      | Cream the butter and sugar |
      | Heat the oven to 180C      |
    When I open the recipe "Apple cake"
    And I move the step "Heat the oven to 180C" up
    And I come back to the app
    And I open the recipe "Apple cake"
    Then "Apple cake" has the method:
      | Heat the oven to 180C      |
      | Cream the butter and sugar |

  Example: a line stays in its own group
    Given "Apple cake" has the ingredients:
      | 200g plain flour |
      | 3 apples         |
    And "Apple cake" has the method:
      | Heat the oven to 180C |
    When I open the recipe "Apple cake"
    And I move the ingredient "3 apples" down
    Then "Apple cake" has the ingredients:
      | 200g plain flour |
      | 3 apples         |
    And "Apple cake" has the method:
      | Heat the oven to 180C |
