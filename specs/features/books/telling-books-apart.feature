@feature:look-telling-books-apart @workflow:find-a-recipe @workflow:organise-the-books
Feature: Telling one book from another without reading

  A book's colour is only worth storing if it can be seen. This file is where it
  is seen: down the binding edge of the page, and beside every book in the book
  menu.

  **The ribbon** is the signature — a band of the book's colour running the full
  height of the page just outside the stitching, sewn in at the head and hanging
  past the foot with a cut end. It is the thing a book you cook from actually
  has, it is read from a step back without looking at it, and it never carries a
  word. The stitching beside it takes the same colour, because a book is bound in
  one colour of thread and one ribbon rather than two.

  What the colour is not allowed to cost is in spec.md next to this file, and
  the two guarantees that hold it there are below: nothing coloured goes under
  text, and nothing is ever identified by colour alone.

  Background:
    Given the app is open
    And the books are:
      | Sweets |
      | Dinner |
    And the open book is named "Sweets"

  @rule:the-open-book-wears-its-colour
  Rule: The ribbon and the stitching are the open book's colour, and carry no words

    Example: opening the green book
      Given I colour the open book "green"
      Then the ribbon is "green"
      And the stitching is "green"
      And the ribbon carries no text

    Example: switching to a book of another colour
      Given I colour the open book "green"
      And I open the book "Dinner"
      When I colour the open book "blue"
      Then the ribbon is "blue"
      When I open the book "Sweets"
      Then the ribbon is "green"

  @rule:every-book-in-the-menu-wears-its-colour
  Rule: Each book in the book menu is marked in its own colour, beside its name

    Example: the shelf, at a glance
      Given I colour the open book "green"
      And I open the book "Dinner"
      And I colour the open book "plum"
      When I open the book menu
      Then the book menu reads:
        | Sweets | green |
        | Dinner | plum  |

  @rule:colour-is-never-the-only-thing-saying-which-book
  Rule: Every place a colour says which book, the name says it too

    Example: the name is on screen either way
      Given I colour the open book "teal"
      Then the open book is named "Sweets"
      When I open the book menu
      Then the books are:
        | Sweets |
        | Dinner |

  @rule:every-book-colour-shows-on-paper
  Rule: All six colours clear 3 to 1 against the page and against the ground

    Example: the six a book can be bound in
      Then each of the six book colours clears 3 to 1 against the page
      And each of the six book colours clears 3 to 1 against the ground

  @rule:the-front-door-has-no-ribbon
  Rule: At the home no book is open, so there is no ribbon

    Example: arriving at the front door
      Given I colour the open book "plum"
      When the app is opened at the home
      Then there is no ribbon
      And the stitching is "red"
