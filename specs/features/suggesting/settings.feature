@feature:suggesting-settings
Feature: Turning the AI on and off

  Somewhere to change your mind. Dismissing the offer has to be reversible or it
  is a decision made once, at the worst possible moment, by somebody who had not
  used the thing yet — and turning it off has to be possible or the only way out
  of a feature you dislike is a browser that cannot run it.

  **A popover in the colophon, not a screen.** `../../persona.md` says Nell will
  never read a settings screen and `../../setup/constraints.md` says there is no
  second page. Both survive: this is the same shape as the book menu, which
  `../books/spec.md` already defended — "a menu over the one page, not a screen
  to navigate to", opened for two seconds and closed. It holds two lines. If it
  ever needs a third, that is the argument that it has become the screen.

  It sits at the foot of the page because position follows how often a thing is
  used. This is pressed twice ever; the book control is pressed constantly, and
  it keeps the top corner to itself.

  Turning it off is not the same as not having it. A machine with no model shows
  nothing at all; a machine where it is switched off shows the way back on, and
  nothing else.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |

  @planned @rule:ai-settings-is-a-popover
  Rule: The settings are a popover over the one page, and shut like one

    Example: it does not take the contents away
      Given a model that is ready
      And the AI is on
      When I open the AI settings
      Then the contents reads:
        | Apple pie |
      When I open the recipe "Apple pie"
      Then the AI settings are shut

    Example: it holds two lines, which is the whole of the argument for it
      Given a model that is ready
      And the AI is on
      Then the AI settings hold 2 lines

  @planned @rule:ai-turned-on-from-settings
  Rule: A dismissed offer can still be taken up later

    Example: changing my mind a week later
      Given a model that has to be fetched first
      And I dismissed the offer
      When I open the AI settings
      And I turn the AI on
      Then the AI is on
      And the indicator reads "Downloading AI"

    Example: the way back is there even when everything else is not
      Given a model that has to be fetched first
      And I dismissed the offer
      Then there is no indicator
      And there is a way to open the AI settings

  @planned @rule:ai-turned-off-from-settings
  Rule: Turning it off takes the AI off the page, downloaded or not

    Example: switching it off once it is there
      Given a model that is ready
      And the AI is on
      When I open the AI settings
      And I turn the AI off
      Then there is no indicator
      And "Apple pie" offers no way to ask for a draft

    Example: what it wrote stays written
      Given a model that is ready
      And the AI is on
      And "Apple pie" has the ingredients:
        | 3 apples |
      When I open the AI settings
      And I turn the AI off
      Then "Apple pie" shows the ingredients:
        | 3 apples |

  @planned @rule:ai-choice-is-remembered
  Rule: The answer is kept, because being asked twice is being asked once too often

    Example: off stays off
      Given a model that is ready
      And the AI is on
      When I open the AI settings
      And I turn the AI off
      And I reload
      Then the AI is off
      And I am not offered the AI

    Example: on stays on
      Given a model that is ready
      And the AI is on
      When I reload
      Then the AI is on
      And the indicator reads "AI ready"

    Example: making a book does not lose the answer
      Given a model that is ready
      And the AI is on
      When I make a book called "Dinner"
      Then the AI is on
