@feature:suggesting-indicator @workflow:fill-a-recipe-in
Feature: Where the AI stands

  One line in the masthead saying whether the machine can help yet. It answers
  one question — **would waiting change this?** — and it says nothing at all
  when the answer is no, because there is no model or because the AI is off.
  `../../spec.md` says chrome around the contents earns its place or it goes,
  and a line reporting a thing you cannot use has not earned it.

  It is a readout, never a control: it is read at a glance and never pressed.
  The switch for it is in the colophon at the foot of the page, where a book
  puts its machinery — see `settings.feature`.

  **It is never a loading screen.** `../../spec.md` promises every action lands
  on the next frame. Writing a recipe down, opening one, filling one in by hand
  and searching are all unchanged while a model is being fetched, and none of
  them ever waits.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |

  @rule:ai-indicator-says-where-it-stands
  Rule: The indicator says it is coming, how far along, and then that it is ready

    Example: watching it arrive
      Given a model that has to be fetched first
      When I accept the offer
      Then the indicator reads "Downloading AI"
      When the fetch reaches 40%
      Then the indicator reads "Downloading AI 40%"
      When the fetch finishes
      Then the indicator reads "AI ready"

    Example: already there on a machine that has it
      Given a model that is ready
      And the AI is on
      Then the indicator reads "AI ready"

    Example: a fetch that fails says so rather than saying nothing
      Given a model that fails to be fetched
      When I accept the offer
      Then the indicator reads "AI unavailable"

  @rule:ai-indicator-only-when-on
  Rule: Nothing is reported about an AI that is off or absent

    Example: no model at all
      Given there is no model
      Then there is no indicator

    Example: turned off
      Given a model that is ready
      And the AI is off
      Then there is no indicator

    Example: not yet answered says nothing either
      Given a model that is ready
      Then there is no indicator

  @rule:ai-indicator-is-not-a-loading-screen
  Rule: Nothing on the page waits for the AI, ever

    Example: the app is the app while the model is coming
      Given a model that has to be fetched first
      When I accept the offer
      And I write down "Bakewell tart"
      Then the contents reads:
        | Bakewell tart |
        | Apple pie     |
      When I search for "apple"
      Then the results read:
        | Apple pie | Sweets |

    Example: filling one in by hand does not wait either
      Given a model that has to be fetched first
      When I accept the offer
      And I add the ingredient "3 apples" to "Apple pie"
      Then "Apple pie" shows the ingredients:
        | 3 apples |
