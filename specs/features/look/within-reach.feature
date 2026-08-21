@feature:look-within-reach
Feature: Within reach — the same book for every hand

  Version 0017 is a design revisit with nothing on it to see. The look was
  audited whole — contrast, focus, motion, what a screen reader meets — and
  most of it was already written down as rules and held. These four are what
  the audit found missing. They are guarantees about who can reach the page,
  not about what it looks like: nothing here moves a pixel for a mouse user
  reading in the browser's default size.

  What "the announcer" is, and why it is one line and off screen, is in
  spec.md next to this file.

  Background:
    Given the app is open
    And the open book is named "Sweets"

  @planned
  @rule:small-marks-hit-big
  Rule: A control drawn small still offers a fingertip's worth to hit

    The grip and the crosses are drawn quiet on purpose — furniture that
    waits to be reached for. Waiting quietly is allowed; being hard to hit
    is not. 24 pixels each way is the floor, however small the mark.

    Example: the marks on a line
      Given the contents reads:
        | Apple cake |
      And "Apple cake" has the ingredients:
        | 3 apples |
      When I open the recipe "Apple cake"
      Then the grip on a line offers at least 24 pixels each way
      And the cross on a line offers at least 24 pixels each way

  @planned
  @rule:what-just-happened-is-announced
  Rule: What just changed off screen is said aloud, off screen

    A search redraws a list the reader of a screen cannot glance at, and a
    delete removes the very thing that was in hand. Both say so, in one
    polite line only assistive technology meets.

    Example: a search says how many it found
      Given the book "Sweets" holds:
        | Lemon drizzle |
        | Lemon chicken |
        | Apple cake    |
      When I search for "lemon"
      Then the announcer says "2 found"

    Example: a search that finds nothing says so
      When I search for "paella"
      Then the announcer says "No recipe matches that."

    Example: a deleted line is announced
      Given the contents reads:
        | Apple cake |
      And "Apple cake" has the ingredients:
        | 3 apples |
      When I open the recipe "Apple cake"
      And I delete the ingredient "3 apples" from "Apple cake"
      Then the announcer says "Deleted 3 apples"

  @planned
  @rule:deleting-keeps-the-keyboards-place
  Rule: Deleting by keyboard leaves the keyboard on the next thing, not nowhere

    A pressed cross takes its whole line with it, and focus must not go
    down with the ship. It lands on the cross of the line that took the
    deleted one's place — or, when the group is empty, in the box that
    writes the next one.

    Example: a middle line hands focus to the next
      Given the contents reads:
        | Apple cake |
      And "Apple cake" has the ingredients:
        | 200g plain flour |
        | 3 apples         |
      When I open the recipe "Apple cake"
      And I delete the ingredient "200g plain flour" from "Apple cake"
      Then focus is on the cross of the line "3 apples"

    Example: the last line hands focus to the composer
      Given the contents reads:
        | Apple cake |
      And "Apple cake" has the ingredients:
        | 3 apples |
      When I open the recipe "Apple cake"
      And I delete the ingredient "3 apples" from "Apple cake"
      Then focus is in the ingredient box of "Apple cake"

    Example: a deleted recipe hands focus the same way
      Given the contents reads:
        | Apple cake    |
        | Lemon drizzle |
      When I delete the recipe "Apple cake"
      Then focus is on the cross of the recipe "Lemon drizzle"

  @planned
  @rule:no-text-is-sized-in-pixels
  Rule: Every size on the page is relative, so the browser's own setting reaches every word

    A reader who has told their browser to write larger has told this app
    too. A pixel size anywhere in the stylesheet is a place that stops
    listening.

    Example: the stylesheet's sizes
      Then no text is sized in pixels
