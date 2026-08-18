@feature:recipe-deleting
Feature: Throwing something out

  Deleting removes a recipe, an ingredient or a step for good. There is no undo
  in this version, and what is being destroyed may be the only copy — see
  ../../changes/0004-recipe-book.md.

  Background:
    Given the app is open

  @rule:delete-removes-only-that-one
  Rule: Deleting removes exactly the one asked for

    Example: deleting the middle of three recipes
      Given the contents reads:
        | Lemon drizzle |
        | Apple cake    |
        | Roast chicken |
      When I delete the recipe "Apple cake"
      Then the contents reads:
        | Lemon drizzle |
        | Roast chicken |

    Example: deleting one ingredient out of a recipe
      Given the contents reads:
        | Apple cake |
      And "Apple cake" has the ingredients:
        | 200g plain flour |
        | 3 apples         |
      When I open the recipe "Apple cake"
      And I delete "3 apples"
      Then "Apple cake" shows the ingredients:
        | 200g plain flour |

  @rule:delete-parent-deletes-sub-todos
  Rule: Deleting a recipe takes its ingredients and its method with it

    Example: the whole thing goes at once
      Given the contents reads:
        | Apple cake |
      And "Apple cake" has the ingredients:
        | 200g plain flour |
      And "Apple cake" has the method:
        | Heat the oven to 180C |
      When I delete the recipe "Apple cake"
      Then the contents is empty
