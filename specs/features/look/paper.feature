@feature:look-paper
Feature: Paper, ink, and a second voice

  The app looks like a book somebody has actually cooked from: a grained paper
  ground, a page laid on it, index cards with a red margin rule, one piece of
  tape. What that is *for* is in spec.md next to this file.

  A look is mostly taste and does not belong in a contract. These three rules
  are the part that is not taste — the guarantees a future palette or a fancier
  face is not allowed to break, because breaking them costs the glance rather
  than the mood.

  Background:
    Given the app is open

  @rule:paper-under-everything
  Rule: The whole page is warm paper, lightest where the reading happens

    Example: the ground, the page and the card
      Then the ground, the page and the card are all warm
      And each one is lighter than the one it sits on

  @rule:ink-reads-on-paper
  Rule: Every colour a recipe is read in clears 4.5 to 1 against what it sits on

    Example: the colours a recipe is read in
      Then the ink on a card clears 4.5 to 1
      And the ink on the page clears 4.5 to 1
      And the muted ink on the page clears 4.5 to 1
      And the muted ink on a card clears 4.5 to 1
      And the red on a card clears 4.5 to 1
      And the red on the page clears 4.5 to 1
      And the label on the Add button clears 4.5 to 1

  @rule:handwriting-labels-but-is-not-read
  Rule: The second face labels the book; a recipe is set in the reading face

    Example: what each face is used for
      Given the contents reads:
        | Apple cake |
      And "Apple cake" has the ingredients:
        | 200g plain flour |
      And "Apple cake" has the method:
        | Heat the oven to 180C |
      When I open the recipe "Apple cake"
      Then the title is set in the labelling face
      And the group headings are set in the labelling face
      And the recipe's name is set in the reading face
      And its ingredients are set in the reading face
      And its method is set in the reading face
