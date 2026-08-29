import { useState, type FormEvent } from "react";

type DeliveryForm = {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  item_description: string;
};

const initialForm: DeliveryForm = {
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  item_description: "",
};

type Props = {
  onSubmit: (form: DeliveryForm) => Promise<void>;
};

export default function NewDeliveryForm({ onSubmit }: Props) {
  const [form, setForm] = useState<DeliveryForm>(initialForm);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  function update(field: keyof DeliveryForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await onSubmit(form);

      setForm({
        ...initialForm,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create delivery",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Create Delivery</h2>

      <p className="muted">Enter the customer and package information.</p>

      <form className="form-stack" onSubmit={submit}>
        <input
          type="text"
          placeholder="Customer name"
          value={form.customer_name}
          onChange={(event) => update("customer_name", event.target.value)}
          required
        />

        <input
          type="tel"
          placeholder="Customer phone"
          value={form.customer_phone}
          onChange={(event) => update("customer_phone", event.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Delivery address"
          value={form.customer_address}
          onChange={(event) => update("customer_address", event.target.value)}
          required
        />

        <textarea
          placeholder="Item description"
          value={form.item_description}
          onChange={(event) => update("item_description", event.target.value)}
          required
        />

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Creating..." : "Create delivery"}
        </button>
      </form>
    </section>
  );
}
