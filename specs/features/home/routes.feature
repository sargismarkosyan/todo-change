@feature:home-routes
Feature: A front door, and a book with its own address

  There are two things to look at now. **A book** is a contents page that is
  read down and written into, and it is what this app has always been. **The
  home** is the front door: the search box, and three recipes to start from, and
  neither a contents nor the box.

  Each has an address. `#/` is the home and `#/book/<id>` is one book. A pinned
  tab therefore reopens on the book it was left on rather than on whatever
  storage happens to say, and Back means what it means everywhere else on the
  web.

  Still one page: one `index.html`, no router library, no build step, no second
  file. What is new is that the page says which of the two it is showing. See
  spec.md beside this file, and `setup/constraints.md`, which this version
  amends.

  An address is untrusted input, in the same posture as `localStorage`: anybody
  can type one, and one naming a book that is not there must open the front door
  rather than a blank page.

  Background:
    Given the books are:
      | Sweets |
      | Dinner |
    And the book "Sweets" holds:
      | Apple cake    |
      | Lemon drizzle |
    And the book "Dinner" holds:
      | Roast chicken |
      | Lemon chicken |

  @rule:the-front-door-is-the-home
  Rule: With no book in the address, the app opens on the home

    Example: arriving with nothing in the address
      Given the app is opened at the home
      Then the search box is on screen
      And the picks are on screen
      And the contents is not on screen
      And there is nothing on screen to write a recipe into

  @rule:a-book-has-its-own-address
  Rule: A book's address opens that book, and that is the book written into

    Example: going into the other book
      Given the app is opened at the home
      When I go into the book "Dinner"
      Then the address names the book "Dinner"
      And the masthead names the book "Dinner"
      And the contents reads:
        | Roast chicken |
        | Lemon chicken |

    Example: opening straight into a book, and writing in it
      Given the app is opened at the book "Dinner"
      When I write down "Paella"
      Then the contents reads:
        | Paella        |
        | Roast chicken |
        | Lemon chicken |

  @rule:the-masthead-goes-home
  Rule: The title of the book takes you back to the front door

    Example: out of a book again
      Given the app is opened at the book "Dinner"
      When I press the masthead title
      Then I am on the home
      And the picks are on screen

  @rule:back-and-forward-move-between-them
  Rule: Back and forward walk the same way in and out

    Example: in, out, and in again
      Given the app is opened at the home
      When I go into the book "Dinner"
      And I go back
      Then I am on the home
      When I go forward
      Then I am in the book "Dinner"

  @rule:an-address-that-names-nothing-opens-the-front-door
  Rule: An address naming no book opens the home, never a blank page

    Example: a book that is not there
      Given the app is opened at the address "#/book/1739827000000-1a2b3c4d5e6f7a8b"
      Then I am on the home
      And the picks are on screen

    Example: something nobody meant to type
      Given the app is opened at the address "#/rubbish"
      Then I am on the home
