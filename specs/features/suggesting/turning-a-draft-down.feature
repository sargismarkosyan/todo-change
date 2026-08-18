@feature:suggesting-refusing
Feature: Not taking the draft

  Three ways to end up with nothing, and all three leave the recipe exactly as
  it was. Turning a draft down has to cost nothing, or the press that asks for
  one is a press nobody dares make.

  The third is the one that matters most: most browsers have no model at all,
  and there the control is simply not on the page. Not greyed, not disabled, not
  explained — an affordance for something this machine can never do is permanent
  furniture advertising an absence. Writing a recipe out by hand is how this app
  works, and it is unchanged.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"

  @planned @rule:draft-dismissed-changes-nothing
  Rule: Turning the whole draft down leaves the recipe as it was

    Example: none of it was any good
      Given the AI is on
      And a model that drafts:
        | ingredients | 200g plain flour |
        | steps       | Heat the oven    |
      When I ask for a draft of "Apple pie"
      And I dismiss the draft
      Then there are no proposals
      And "Apple pie" shows no ingredients
      And "Apple pie" shows no method

    Example: what was taken before dismissing stays taken
      Given the AI is on
      And a model that drafts:
        | ingredients | 200g plain flour |
        | ingredients | 3 apples         |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "3 apples"
      And I dismiss the draft
      Then "Apple pie" shows the ingredients:
        | 3 apples |

  @planned @rule:draft-can-fail
  Rule: A model that answers with nothing usable says so, and changes nothing

    Example: nothing came back
      Given the AI is on
      And a model that drafts nothing
      When I ask for a draft of "Apple pie"
      Then I see the message "Nothing drafted."
      And "Apple pie" shows no ingredients

    Example: the model failed
      Given the AI is on
      And a model that fails
      When I ask for a draft of "Apple pie"
      Then I see the message "The draft could not be written."
      And "Apple pie" shows no ingredients

    Example: a failure leaves the recipe writable by hand
      Given the AI is on
      And a model that fails
      When I ask for a draft of "Apple pie"
      And I add the ingredient "3 apples" to "Apple pie"
      Then "Apple pie" shows the ingredients:
        | 3 apples |

  @planned @rule:draft-needs-the-ai-on
  Rule: With no model, or with the AI off, there is nothing to press

    Example: a browser that will never have one
      Given there is no model
      Then "Apple pie" offers no way to ask for a draft
      And I see no message about a model

    Example: switched off
      Given a model that is ready
      And the AI is off
      Then "Apple pie" offers no way to ask for a draft

    Example: writing it out by hand is untouched
      Given there is no model
      When I add the ingredient "3 apples" to "Apple pie"
      And I add the step "Heat the oven to 180C" to "Apple pie"
      Then "Apple pie" shows the ingredients:
        | 3 apples |
      And "Apple pie" shows the method:
        | Heat the oven to 180C |
