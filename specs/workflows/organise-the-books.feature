@workflow:organise-the-books @persona:nell @journey:keeping-what-you-cook
Feature: Organise the books

  When there are enough books that the menu no longer reads at a glance, or one
  of them is called the wrong thing,
  I want the shelf to say which book is which without being read,
  so the next twenty times I go looking for one it costs nothing.

  **Ends when** the shelf reads at a glance: the right names, and a colour on
  each.

  **One workflow, not two.** Creating, renaming and colouring are the same
  moment — you are looking at the shelf and it is wrong. They differ in what
  they cost, not in what triggers them, and splitting by verb would put three
  files under three ids that are always edited together.

  **This is the one workflow that pays off somewhere else.** Nothing here helps
  the person doing it, in the moment they do it. It is done once to a book and
  then never again, and every penny of the return arrives inside
  `find-a-recipe`, twenty times over the following year. That is why it may be
  slow, may take a click, and may live behind a menu — and why a change that
  makes *this* faster at the cost of a step in `name-a-recipe` is a bad trade
  even though both numbers moved.

  **A book is an occasion, not a category.** Sweets, Dinner, Chicken, the four
  things they make when there is no time. Renaming one is allowed to be an
  ordinary thing precisely because the name is a label on a moment rather than a
  taxonomy anything depends on.

  **Colour, since 0015.** Six bindings, one press each on the swatches in the
  book menu, undone by pressing another. It destroys nothing, and it is the only
  thing in this workflow that does not. The colour is a *name* in storage, not a
  hex — see `../spec.md`.

  **Where it breaks.** A colour picker instead of six swatches. A rename that
  asks twice. Anything that makes creating a book feel like a decision, when the
  right moment to make one is the moment a recipe turns up that does not belong
  in the open one.

  Example: a new book for a new occasion
    Given the book "Sweets" is open
    When I start a new book called "Dinner"
    Then the open book is "Dinner"
    And its contents is empty
    And "Sweets" is still on the shelf

  Example: a book called the wrong thing
    Given the book "Puddings" is open
    When I rename the book "Puddings" to "Sweets"
    Then the open book is "Sweets"
    And its recipes are all still in it

  Example: telling two books apart without reading them
    Given the book "Sweets" is open
    When I colour the book "Sweets" green
    Then the ribbon and the stitching are green
    And "Sweets" is marked green in the book menu
    And it is still green when I come back to the app
