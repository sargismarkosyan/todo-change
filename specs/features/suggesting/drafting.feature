@feature:suggesting-drafting
Feature: The AI drafting a recipe

  A recipe is written down in three seconds and then filled in one line at a
  time — a dozen ingredients, then the method. That second part is where a
  recipe stops halfway, and a book of names with nothing under them is the
  failure this answers.

  One press asks the browser's own model for the whole card: what it takes and
  how it is made, both at once. **Not one line of it is written down.** A draft
  is a proposal until it is accepted, and it is accepted a line at a time,
  because a wrong quantity is not a wrong word — it is a cake that does not
  work, and there is no undo anywhere in this app.

  What is already on the recipe is left alone. A draft is added to a recipe,
  never over it: nothing is replaced, nothing is reordered, and a line the
  recipe already has is not proposed back to it.

  These rules never assert what a model says. A model is handed to the app the
  way the document and the storage are, so what is asserted is what the app does
  with an answer — never the answer. See `spec.md`.

  Background:
    Given the app is open
    And the AI is on
    And the open book is named "Sweets"
    And the contents reads:
      | Apple pie |
    And I open the recipe "Apple pie"

  @rule:draft-proposes-both-groups
  Rule: One press proposes what it takes and how it is made, and writes down neither

    Example: a bare name, filled in
      Given a model that drafts:
        | ingredients | 200g plain flour      |
        | ingredients | 3 apples              |
        | steps       | Heat the oven to 180C |
      When I ask for a draft of "Apple pie"
      Then the proposed ingredients read:
        | 200g plain flour |
        | 3 apples         |
      And the proposed method reads:
        | Heat the oven to 180C |
      And "Apple pie" shows no ingredients
      And "Apple pie" shows no method

    Example: a proposal is not written down, so it does not survive the tab
      Given a model that drafts:
        | ingredients | 3 apples |
      When I ask for a draft of "Apple pie"
      And I reload
      Then "Apple pie" shows no ingredients

  @rule:draft-accepted-line-by-line
  Rule: A proposal becomes a line only when it is taken, one at a time

    Example: taking one of two
      Given a model that drafts:
        | ingredients | 200g plain flour |
        | ingredients | 3 apples         |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "3 apples"
      Then "Apple pie" shows the ingredients:
        | 3 apples |
      And the proposed ingredients read:
        | 200g plain flour |

    Example: the method takes the order they were accepted in
      Given a model that drafts:
        | steps | Heat the oven to 180C     |
        | steps | Peel and slice the apples |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "Peel and slice the apples"
      And I accept the proposal "Heat the oven to 180C"
      Then "Apple pie" shows the method:
        | Peel and slice the apples |
        | Heat the oven to 180C     |

    Example: once taken it is an ordinary line, and goes the ordinary way
      Given a model that drafts:
        | ingredients | 3 apples |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "3 apples"
      And I delete the ingredient "3 apples"
      Then "Apple pie" shows no ingredients

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

  @rule:draft-does-not-touch-what-is-there
  Rule: A draft is added to a recipe, never written over it

    Example: a recipe already half typed
      Given "Apple pie" has the ingredients:
        | 3 apples |
      And a model that drafts:
        | ingredients | 3 apples         |
        | ingredients | 200g plain flour |
      When I ask for a draft of "Apple pie"
      Then the proposed ingredients read:
        | 200g plain flour |
      And "Apple pie" shows the ingredients:
        | 3 apples |

    Example: what was typed stays where it was typed
      Given "Apple pie" has the ingredients:
        | 3 apples |
      And a model that drafts:
        | ingredients | 200g plain flour |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "200g plain flour"
      Then "Apple pie" shows the ingredients:
        | 3 apples         |
        | 200g plain flour |
