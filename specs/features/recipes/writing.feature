@feature:recipe-writing @workflow:name-a-recipe
Feature: Writing a recipe down

  A recipe comes into existence as a name, typed into the box at the top and
  entered. Nothing else makes one, and nothing else is asked for at that moment
  — what it takes and how to make it are typed into it afterwards, with it open.

  Background:
    Given the app is open

  @rule:add-goes-to-top
  Rule: A new recipe goes to the top of the contents

    Example: writing one down in an empty book
      When I write down "Apple cake"
      Then the contents reads:
        | Apple cake |

    Example: it goes above what is already there
      Given the contents reads:
        | Lemon drizzle |
      When I write down "Apple cake"
      Then the contents reads:
        | Apple cake    |
        | Lemon drizzle |

  @rule:add-clears-the-box
  Rule: The box is emptied once the recipe is written down

    Example: the box is ready for the next one
      When I write down "Apple cake"
      Then the box is empty

  @rule:add-rejects-blank
  Rule: Blank text does not become a recipe

    Example: pressing Enter on an empty box
      When I submit ""
      Then the contents is empty

    Example: submitting only spaces
      When I submit "   "
      Then the contents is empty
