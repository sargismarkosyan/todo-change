@feature:book-colouring
Feature: Giving a book a colour

  Every book in this app renders identically. The only thing telling one from
  another is its name — read in the masthead, or read down the book menu — and
  ../books/spec.md already names the mistake that makes possible: writing into
  the wrong book. Colour is the answer that needs no reading.

  Six colours, chosen from a strip of swatches in the book menu, beside the
  books they belong to. Six rather than any colour at all: a book is bound in
  cloth somebody had, not mixed to order, and every one of the six is checked
  once against the paper instead of guessed at per press.

  The first swatch is the red every book already has, so a book nobody has
  coloured is the book this app has always drawn, and there is nothing to clear.

  Only the open book can be coloured, the same way only the open book can be
  renamed or deleted. Colouring is Tidy — rare, deliberate, and done to the book
  you are already in.

  Background:
    Given the app is open
    And the books are:
      | Sweets |
      | Dinner |
    And the open book is named "Sweets"
    And the contents reads:
      | Apple cake |

  @planned
  @rule:a-book-takes-a-colour
  Rule: Pressing a swatch colours the open book, and pressing another changes it

    Example: Sweets becomes the green book
      When I colour the open book "green"
      Then the open book's colour is "green"
      And the swatch "green" is the chosen one

    Example: changing my mind
      Given I colour the open book "green"
      When I colour the open book "plum"
      Then the open book's colour is "plum"
      And the swatch "plum" is the chosen one

    Example: a book nobody has coloured is red
      Then the open book's colour is "red"
      And the swatch "red" is the chosen one

  @planned
  @rule:a-colour-belongs-to-one-book
  Rule: Colouring one book leaves every other book the colour it was

    Example: two books, two colours
      Given I colour the open book "green"
      When I open the book "Dinner"
      Then the open book's colour is "red"
      When I colour the open book "blue"
      And I open the book "Sweets"
      Then the open book's colour is "green"

  @planned
  @rule:a-books-colour-is-kept
  Rule: A colour survives being closed and come back to

    Example: reopening tomorrow
      Given I colour the open book "teal"
      When the app is opened again
      Then the open book's colour is "teal"

  @planned
  @rule:colouring-changes-nothing-else
  Rule: A colour is all that changes — same name, same recipes, same order

    Example: the book is otherwise untouched
      Given "Apple cake" has the ingredients:
        | 200g plain flour |
      And I write down "Lemon drizzle"
      When I colour the open book "ochre"
      Then the open book is named "Sweets"
      And the contents reads:
        | Lemon drizzle |
        | Apple cake    |
      And no recipe is open
      And the book menu is still open

  @planned
  @rule:an-unknown-colour-is-the-red-it-always-was
  Rule: A stored colour that is not one of the six reads as the red

    Example: a colour nobody offered
      Given the book "Sweets" is stored with the colour "chartreuse"
      When the app is opened
      Then the open book's colour is "red"
      And the contents reads:
        | Apple cake |
