@feature:recipe-favourites
Feature: Marking a recipe as one of the usual

  Most of what gets cooked comes from a handful of recipes, and the rest of the
  book is the archive around them. **A favourite** is a recipe marked as one of
  that handful, by pressing **the star** on its row in the contents.

  It is not a tick and it is not a rating. A tick says *finished* — the thing
  goes away by being done — and a star says the opposite: come back to this one.
  There is no scale, no second star, and nothing about whether a recipe is any
  good. `persona.md` rules out being *asked* to mark things, and nothing here
  asks: a recipe nobody stars behaves exactly as it always has.

  What the star buys is on the home, in `../home/favourites.feature`. What it
  must not do is anything else — the contents is hand-ordered and nothing in
  this app rearranges itself.

  Background:
    Given the app is opened at the book "Sweets"
    And the contents reads:
      | Apple cake    |
      | Lemon drizzle |
      | Bakewell tart |

  @rule:a-recipe-can-be-starred
  Rule: Pressing the star marks a recipe, and pressing it again unmarks it

    Example: the one that gets made every week
      When I star the recipe "Apple cake"
      Then "Apple cake" is a favourite
      And "Lemon drizzle" is not a favourite

    Example: changing your mind about it
      Given I star the recipe "Apple cake"
      When I star the recipe "Apple cake"
      Then "Apple cake" is not a favourite

    Example: every recipe offers the star, marked or not
      Then every recipe in the contents offers the star
      And no recipe in the contents offers a tick box

  @rule:a-star-is-kept
  Rule: A star survives being closed, like everything else written down

    Example: coming back to it next month
      Given I star the recipe "Bakewell tart"
      When I open the app again at the book "Sweets"
      Then "Bakewell tart" is a favourite
      And "Apple cake" is not a favourite

    Example: a stored star that is not one is not a star
      Given "todo-change.books" holds:
        | {"books": [{"id": "b1", "name": "Sweets", "recipes": [{"id": "r1", "name": "Apple cake", "favourite": "yes"}, {"id": "r2", "name": "Lemon drizzle", "favourite": true}]}], "openId": "b1"} |
      When I open the app at the book "Sweets"
      Then "Apple cake" is not a favourite
      And "Lemon drizzle" is a favourite

  @rule:starring-moves-nothing
  Rule: Starring changes nothing else about a recipe or the contents

    Example: the contents stays in the order it was put in
      When I star the recipe "Bakewell tart"
      Then the contents reads:
        | Apple cake    |
        | Lemon drizzle |
        | Bakewell tart |

    Example: starring is not opening
      Given I open the recipe "Lemon drizzle"
      When I star the recipe "Apple cake"
      Then "Lemon drizzle" is open
      And "Apple cake" is closed

    Example: a starred recipe is deleted like any other
      Given I star the recipe "Apple cake"
      When I delete the recipe "Apple cake"
      Then the contents reads:
        | Lemon drizzle |
        | Bakewell tart |
