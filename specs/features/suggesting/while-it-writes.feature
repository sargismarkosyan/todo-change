@feature:suggesting-while-it-writes
Feature: While the model is writing

  Running the model is the second slow thing, and the one that happens every
  time: asking for a draft is inference, and inference takes seconds even on a
  model already on the machine. A press that appears to do nothing for four
  seconds is the worst version of that.

  So the control says it is working, and it says the other half too — that
  nothing else has to wait — because a person who does not know that will sit
  and wait for no reason. `../../spec.md` promises every action lands on the
  next frame, and every action still does. This one reports instead.

  It cannot be asked twice at once. A second press would be a second session and
  a second answer nobody asked for.

  Background:
    Given the app is open
    And the AI is on
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"

  @rule:draft-says-it-is-thinking
  Rule: While the model is writing, the page says so and stays usable

    Example: pressing, and waiting
      Given a model that has not answered yet
      When I ask for a draft of "Apple pie"
      Then the draft control reads "Drafting…"
      And I see the message "Writing a draft. Nothing else has to wait."

    Example: nothing else waits while it thinks
      Given a model that has not answered yet
      When I ask for a draft of "Apple pie"
      And I add the ingredient "3 apples" to "Apple pie"
      Then "Apple pie" shows the ingredients:
        | 3 apples |

    Example: it cannot be asked twice at once
      Given a model that has not answered yet
      When I ask for a draft of "Apple pie"
      Then the draft control cannot be pressed

    Example: the words go back when the answer lands
      Given a model that drafts:
        | ingredients | 3 apples |
      When I ask for a draft of "Apple pie"
      Then the draft control reads "Draft this recipe"
      And I see no message
