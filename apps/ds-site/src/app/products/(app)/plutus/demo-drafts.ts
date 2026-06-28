/**
 * PLACEHOLDER / EXAMPLE DATA — safe to delete.
 *
 * Example drafted reminders for the sample tenant's queue, so the approval gate
 * shows real bilingual content without an ANTHROPIC_API_KEY. With a key, the engine
 * (@ds/plutus draft.ts) generates these live and fact-checks them. Keyed by invoice id.
 */

export const DEMO_DRAFTS: Record<string, { subject: string; body: string }> = {
  'i-kallisto-open': {
    subject: 'Meraki Studio: τιμολόγιο INV-1042',
    body:
      'Αξιότιμη κυρία Παππά,\n\nΤο τιμολόγιο INV-1042 ποσού €4.200,00 παραμένει ανεξόφλητο εδώ και 45 ημέρες. Θα εκτιμούσαμε ιδιαίτερα την τακτοποίησή του το συντομότερο δυνατό· εάν υπάρχει κάποιο ζήτημα με το τιμολόγιο, ενημερώστε μας ώστε να το επιλύσουμε.\n\nΣύμφωνα με την Οδηγία 2011/7/ΕΕ, το ληξιπρόθεσμο τιμολόγιο ενδέχεται να επιβαρυνθεί με τόκους υπερημερίας (επιτόκιο αναφοράς ΕΚΤ + 8 μονάδες) και ελάχιστη αποζημίωση €40.\n\nΤραπεζική κατάθεση: GR16 0110 1250 0000 0001 2345 678 (Meraki Studio).\n\nΜε εκτίμηση,\nMeraki Studio',
  },
  'i-olympus-open': {
    subject: 'Meraki Studio: invoice INV-1045',
    body:
      "Dear George,\n\nInvoice INV-1045 for €3,100.00 is now 26 days overdue. Could you let us know when we can expect payment? And if there's any problem with the invoice, please tell us and we'll put it right.\n\nPayment by bank transfer: GR16 0110 1250 0000 0001 2345 678 (Meraki Studio).\n\nMany thanks,\nMeraki Studio",
  },
  'i-aigaio-open': {
    subject: 'Meraki Studio: τιμολόγιο INV-1048',
    body:
      'Αγαπητέ κύριε Βλαχάκη,\n\nΤο τιμολόγιο INV-1048 ποσού €2.600,00 είναι ληξιπρόθεσμο κατά 15 ημέρες. Μπορείτε να μας ενημερώσετε πότε να αναμένουμε την πληρωμή; Εάν υπάρχει κάποιο ζήτημα, πείτε μας να το επιλύσουμε.\n\nΤραπεζική κατάθεση: GR16 0110 1250 0000 0001 2345 678 (Meraki Studio).\n\nΜε εκτίμηση,\nMeraki Studio',
  },
  'i-nefeli-open': {
    subject: 'Meraki Studio: τιμολόγιο INV-1052',
    body:
      'Αγαπητή κυρία Σάββα,\n\nΤο τιμολόγιο INV-1052 ποσού €640,00 εκκρεμεί εδώ και 21 ημέρες. Κατανοούμε ότι ενίοτε προκύπτουν ταμειακές δυσκολίες, εάν βοηθούσε, μπορούμε να κανονίσουμε τμηματική εξόφληση. Ενημερώστε μας τι σας εξυπηρετεί.\n\nΤραπεζική κατάθεση: GR16 0110 1250 0000 0001 2345 678 (Meraki Studio).\n\nΜε εκτίμηση,\nMeraki Studio',
  },
}
