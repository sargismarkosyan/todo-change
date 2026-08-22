@feature:recipe-ingredients @workflow:fill-a-recipe-in
Feature: What a recipe takes

  An ingredient is one line, written the way it is said out loud — "200g plain
  flour", "3 apples", "a good pinch of salt". The amount is part of the line
  rather than a field of its own: that is how a recipe is read out, that is how
  it is written on a card, and it keeps writing one down to typing.

  Ingredients are typed into a recipe while it is open, and stay in the order
  they were typed.

  Background:
    Given the app is open
    And the contents reads:
      | Apple cake |
    And I open the recipe "Apple cake"

  @rule:ingredient-added-to-recipe
  Rule: An ingredient is typed into the open recipe and appears in it

    Example: the first thing it takes
      When I add the ingredient "200g plain flour" to "Apple cake"
      Then "Apple cake" shows the ingredients:
        | 200g plain flour |
      And "Apple cake" shows no method

    Example: the recipe stays where it was in the contents
      Given the contents reads:
        | Lemon drizzle |
        | Apple cake    |
      And I open the recipe "Apple cake"
      When I add the ingredient "3 apples" to "Apple cake"
      Then the contents reads:
        | Lemon drizzle |
        | Apple cake    |

  @rule:ingredients-keep-typing-order
  Rule: Ingredients stay in the order they were typed

    Example: three things, in the order they were read out
      When I add the ingredient "200g plain flour" to "Apple cake"
      And I add the ingredient "3 apples" to "Apple cake"
      And I add the ingredient "a good pinch of salt" to "Apple cake"
      Then "Apple cake" shows the ingredients:
        | 200g plain flour     |
        | 3 apples             |
        | a good pinch of salt |

  @rule:ingredient-rejects-blank
  Rule: Blank text does not become an ingredient

    Example: submitting only spaces
      When I submit "   " as an ingredient of "Apple cake"
      Then "Apple cake" shows no ingredients
