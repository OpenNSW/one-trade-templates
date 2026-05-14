# Workflows

Per-workflow business context. For technical details about how files relate to each other, see [`architecture.md`](architecture.md).

## NPQS — Export Consignment & Phytosanitary Registration

Top-level id: `npqs-export-phytosanitary-reg` ([`templates/npqs/npqs_workflow.json`](../templates/npqs/npqs_workflow.json))

Models the full lifecycle of applying for and receiving a phytosanitary certificate for an export consignment: from initial application through laboratory sampling, decisions on fumigation and visual inspection, shipping document submission, payment, certificate issuance, and final upload to the IPPC hub.

| Step | Directory | Step flow id |
|---|---|---|
| 1 | `templates/npqs/1-application/` | `npqs-apply-phyto-cert-flow` |
| 2 | `templates/npqs/2-wait_on_sample/` | `npqs-wait-sample-received-flow` |
| 3 | `templates/npqs/3-wait_on_lab_results/` | `npqs-wait-lab-result-flow` |
| 4 | `templates/npqs/4-wait_on_fumigation_decision/` | `npqs-wait-fumigation-flow` |
| 5 | `templates/npqs/5-check_visual_inspection_requirement/` | `npqs-wait-visual-decision-flow` |
| 6 | `templates/npqs/6-visual_inspection_result/` | `npqs-visual-inspection-result-flow` |
| 7 | `templates/npqs/7-submit_shipping_docs/` | `npqs-submit-shipping-docs-flow` |
| 8 | `templates/npqs/8-payment/` | `npqs-pay-certificate-fee-flow` |
| 9 | `templates/npqs/9-issue_certificate/` | `npqs-issue-certificate-flow` |
| 10 | `templates/npqs/10-upload_to_ippc/` | `npqs-upload-ippc-flow` |

## Customs Declaration

Top-level id: `customs-export-declaration-reg` ([`templates/customs/customs_workflow.json`](../templates/customs/customs_workflow.json))

Models the customs declaration ("cusdec") workflow for exports: applicant submits the declaration, pays warranting fees, awaits warranting completion and (where required) manual physical examination, exchanges container delivery notes (FCL/LCL), submits the boat note, and waits for export release.

| Step | Directory | Step flow id |
|---|---|---|
| 1 | `templates/customs/1-cusdec/` | `customs-apply-cusdec-flow` |
| 2 | `templates/customs/2-payment/` | `customs-payment-flow` |
| 3 | `templates/customs/3-warranting/` | `customs-warranting-flow` |
| 4 | `templates/customs/4-physical_exam/` | `customs-physical-exam-flow` |
| 5 | `templates/customs/5-fcl_cdn/` | `customs-fcl-cdn-flow` |
| 6 | `templates/customs/6-lcl_cdn/` | `customs-lcl-cdn-flow` |
| 7 | `templates/customs/7-boat_note/` | `customs-boat-note-flow` |
| 8 | `templates/customs/8-export_release/` | `customs-export-release-flow` |

## FCAU — Food & Chemical Analysis Unit

Top-level id: `fcau-health-certificate-reg` ([`templates/fcau/fcau_workflow.json`](../templates/fcau/fcau_workflow.json))

Models the health certificate application flow administered by the Food & Chemical Analysis Unit: application submission, application fee payment, sample decision and waiting, lab testing, payment of lab fees, sample assessment, and certificate issuance.

| Step | Directory | Step flow id |
|---|---|---|
| 1 | `templates/fcau/1-application/` | `fcau-apply-health-cert-flow` |
| 2 | `templates/fcau/2-payment_app_fee/` | `fcau-pay-app-fee-flow` |
| 3 | `templates/fcau/3-sample_decision/` | `fcau-sample-decision-flow` |
| 4 | `templates/fcau/4-wait_on_sample/` | `fcau-wait-sample-flow` |
| 5 | `templates/fcau/5-sample_assessment/` | `fcau-sample-assessment-flow` |
| 6 | `templates/fcau/6-payment_lab_fee/` | `fcau-pay-lab-fee-flow` |
| 7 | `templates/fcau/7-lab_test/` | `fcau-lab-test-flow` |
| 8 | `templates/fcau/8-issue_certificate/` | `fcau-issue-certificate-flow` |

## CDA — Certificate of Domestic Availability

Top-level id: `cda-quality-cert-issuance-reg` ([`templates/cda/cda_workflow.json`](../templates/cda/cda_workflow.json))

Models issuance of Salmonella-free and physical quality certificates: application, payment, and waiting for certificate issuance via an external event.

| Step | Directory | Step flow id |
|---|---|---|
| 1 | `templates/cda/1-application/` | `cda-apply-cert-flow` |
| 2 | `templates/cda/2-payment/` | `cda-pay-app-fee-flow` |
| 3 | `templates/cda/3-wait_cert/` | `cda-wait-cert-flow` |

## Looking up step task ids

The step flow id is for the step's own `workflow.json`. The actual task templates inside a step (forms, payment actions, wait actions) have additional ids with a `--<role>` suffix. To enumerate all task ids for a step:

```bash
jq '.byId | to_entries | map(select(.value | startswith("templates/npqs/1-application/")))' manifest.json
```

Or look directly at the step's `workflow.json` `nodes[].task_template_id` values.
