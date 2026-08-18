@feature:suggesting-offer
Feature: Being offered the AI, once

  It is offered rather than assumed. The model is a download measured in
  gigabytes, and `../../spec.md` promises nothing loads: starting that behind
  somebody's back is the one thing this app must not do with the network it does
  not otherwise use. The browser agrees — a download cannot begin without a
  press — so the offer is not politeness, it is the mechanism.

  Asked once, and never again. This is the second question this app has ever
  asked; the other is how many recipes go with a book being deleted. Both are
  asked because the answer cannot be guessed and the cost of guessing wrong is
  real.

  It is asked below the box, not above it. The top of the page is the
  three-second capture `../../workflows.md` protects, and a question that pushes
  the box down costs the one workflow this app is most protective of.

  Background:
    Given the app is open
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |

  @rule:ai-offered-once
  Rule: A machine that could run the AI offers it, once, and takes an answer

    Example: the first visit with something to fill in
      Given a model that has to be fetched first
      Then I am offered the AI
      When I dismiss the offer
      And I reload
      Then I am not offered the AI

    Example: an empty book is not the moment to ask
      Given a model that has to be fetched first
      And the contents is empty
      Then I am not offered the AI

    Example: writing the first recipe down is the moment
      Given a model that has to be fetched first
      And the contents is empty
      When I write down "Apple pie"
      Then I am offered the AI

  @rule:ai-offer-accepted
  Rule: Accepting fetches it, and the fetching happens behind the page

    Example: saying yes
      Given a model that has to be fetched first
      When I accept the offer
      Then the AI is on
      And the indicator reads "Downloading AI"
      And I am not offered the AI

    Example: the page is the page while it comes
      Given a model that has to be fetched first
      When I accept the offer
      And I write down "Bakewell tart"
      Then the contents reads:
        | Bakewell tart |
        | Apple pie     |

  @rule:ai-offer-dismissed
  Rule: Dismissing turns it off and leaves no trace on the page

    Example: saying no
      Given a model that has to be fetched first
      When I dismiss the offer
      Then the AI is off
      And there is no indicator
      And "Apple pie" offers no way to ask for a draft

    Example: nothing else is different
      Given a model that has to be fetched first
      When I dismiss the offer
      And I add the ingredient "3 apples" to "Apple pie"
      Then "Apple pie" shows the ingredients:
        | 3 apples |

  @rule:ai-not-offered-without-a-model
  Rule: A browser that cannot run one is never asked about it

    Example: nothing to offer
      Given there is no model
      Then I am not offered the AI
      And there is no indicator

    Example: the API is there but the machine cannot run it
      Given a model that cannot run here
      Then I am not offered the AI
      And there is no indicator
