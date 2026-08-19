@feature:suggesting-drafting
Feature: The AI drafting a recipe

  A recipe is written down in three seconds and then filled in one line at a
  time — a dozen ingredients, then the method. That second part is where a
  recipe stops halfway, and a book of names with nothing under them is the
  failure this answers.

  One press asks the browser's own model for the whole card: what it takes and
  how it is made, both at once. **Not one line of it is written down.** A draft
  is a proposal until it is accepted, because a wrong quantity is not a wrong
  word — it is a cake that does not work, and there is no undo anywhere here.

  What is already on the recipe is left alone. A draft is added to a recipe,
  never over it: nothing is replaced, no line you wrote is reordered, and a line
  the recipe already has is not proposed back to it.

  A proposal sits **where it belongs**, not at the bottom, and a line taken out
  of the middle stays in the middle. Where they sit is `placing-a-draft.feature`;
  how they are taken is `taking-a-draft.feature`.

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
        | ingredients | 0 | 200g plain flour      |
        | ingredients | 1 | 3 apples              |
        | steps       | 0 | Heat the oven to 180C |
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
        | ingredients | 0 | 3 apples |
      When I ask for a draft of "Apple pie"
      And I reload
      Then "Apple pie" shows no ingredients

    Example: a line the model repeats is offered once
      Given a model that drafts:
        | ingredients | 0 | 3 apples   |
        | ingredients | 1 | 3 apples   |
        | ingredients | 2 |  3 apples  |
      When I ask for a draft of "Apple pie"
      Then the proposed ingredients read:
        | 3 apples |

  @rule:draft-accepted-line-by-line
  Rule: A proposal becomes a line where it sits, one at a time

    Example: taking one of two
      Given a model that drafts:
        | ingredients | 0 | 200g plain flour |
        | ingredients | 1 | 3 apples         |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "3 apples"
      Then "Apple pie" shows the ingredients:
        | 3 apples |
      And the proposed ingredients read:
        | 200g plain flour |

    Example: taking one out of the middle leaves it in the middle
      Given "Apple pie" has the method:
        | Heat the oven to 180C |
        | Bake for 45 minutes   |
      And a model that drafts:
        | steps | 1 | Peel and slice the apples |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "Peel and slice the apples"
      Then "Apple pie" shows the method:
        | Heat the oven to 180C     |
        | Peel and slice the apples |
        | Bake for 45 minutes       |

    Example: taken out of order, they still land in the drafted order
      Given a model that drafts:
        | steps | 0 | Heat the oven to 180C     |
        | steps | 1 | Peel and slice the apples |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "Peel and slice the apples"
      And I accept the proposal "Heat the oven to 180C"
      Then "Apple pie" shows the method:
        | Heat the oven to 180C     |
        | Peel and slice the apples |

    Example: once taken it is an ordinary line, and goes the ordinary way
      Given a model that drafts:
        | ingredients | 0 | 3 apples |
      When I ask for a draft of "Apple pie"
      And I accept the proposal "3 apples"
      And I delete the ingredient "3 apples"
      Then "Apple pie" shows no ingredients
