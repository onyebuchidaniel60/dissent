CREATE TABLE "execution_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"certificate_id" text NOT NULL,
	"status" text NOT NULL,
	"tx_hash" text,
	"reason" text,
	"recipient_account_id" text,
	"amount_yocto" numeric(78, 0),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "execution_receipts" ADD CONSTRAINT "execution_receipts_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "execution_receipts_audit_idx" ON "execution_receipts" USING btree ("audit_id");