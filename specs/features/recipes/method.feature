@feature:recipe-method
Feature: The method

  The method is what to do, one step per line, in the order it happens. Steps
  are typed into the recipe while it is open, below the ingredients, and stay in
  the order they were typed — a method is a sequence, and reversing it would
  fight the thing itself.

  Background:
    Given the app is open
    And the contents reads:
      | Apple cake |
    And I open the recipe "Apple cake"

  @rule:sub-todo-added-under-parent
  Rule: A step is typed into the open recipe and appears in its method

    Example: the first thing to do
      When I add the step "Heat the oven to 180C" to "Apple cake"
      Then "Apple cake" shows the method:
        | Heat the oven to 180C |

    Example: the recipe stays where it was in the contents
      Given the contents reads:
        | Lemon drizzle |
        | Apple cake    |
      And I open the recipe "Apple cake"
      When I add the step "Heat the oven to 180C" to "Apple cake"
      Then the contents reads:
        | Lemon drizzle |
        | Apple cake    |

  @rule:sub-todos-keep-typing-order
  Rule: Steps stay in the order they were typed

    Example: three things in sequence
      When I add the step "Heat the oven to 180C" to "Apple cake"
      And I add the step "Peel and slice the apples" to "Apple cake"
      And I add the step "Bake for forty minutes" to "Apple cake"
      Then "Apple cake" shows the method:
        | Heat the oven to 180C     |
        | Peel and slice the apples |
        | Bake for forty minutes    |

  @rule:sub-todo-rejects-blank
  Rule: Blank text does not become a step

    Example: submitting only spaces
      When I submit "   " as a step of "Apple cake"
      Then "Apple cake" shows no method

  @rule:sub-todo-depth-is-one
  Rule: A step holds nothing of its own

    Example: there is no second level to reach for
      Given I add the step "Heat the oven to 180C" to "Apple cake"
      Then "Heat the oven to 180C" offers no way to add anything under it
