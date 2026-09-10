import {
  faMoneyBillTrendUp,
  faCreditCard,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { Delivery } from "../../types";

type Props = {
  orders: Delivery[];
};

export default function RetailerRevenueCard({ orders }: Props) {
  const totalRevenue = orders.reduce(
    (total, order) => total + Number(order.payment_amount ?? 0),
    0,
  );

  const collectedRevenue = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((total, order) => total + Number(order.payment_amount ?? 0), 0);

  const pendingRevenue = totalRevenue - collectedRevenue;

  const prepaidOrders = orders.filter(
    (order) => order.payment_method === "prepaid",
  ).length;

  const cashOrders = orders.filter(
    (order) => order.payment_method === "cash_on_delivery",
  ).length;

  const totalPayments = prepaidOrders + cashOrders;

  const prepaidPercentage =
    totalPayments === 0 ? 0 : Math.round((prepaidOrders / totalPayments) * 100);

  const cashPercentage =
    totalPayments === 0 ? 0 : Math.round((cashOrders / totalPayments) * 100);

  return (
    <div className="retailer-intelligence-card">
      <div className="intelligence-header">
        <div>
          <h3>Revenue Overview</h3>

          <p>Payment performance from deliveries</p>
        </div>

        <FontAwesomeIcon icon={faMoneyBillTrendUp} />
      </div>

      <div className="revenue-main">KES {totalRevenue.toLocaleString()}</div>

      <div className="revenue-grid">
        <div>
          <FontAwesomeIcon icon={faCreditCard} />

          <span>Collected</span>

          <strong>KES {collectedRevenue.toLocaleString()}</strong>
        </div>

        <div>
          <FontAwesomeIcon icon={faClock} />

          <span>Pending</span>

          <strong>KES {pendingRevenue.toLocaleString()}</strong>
        </div>
      </div>

      <div className="payment-breakdown">
        <h4>Payment Methods</h4>

        <div>
          <span>Prepaid</span>

          <strong>{prepaidPercentage}%</strong>
        </div>

        <div>
          <span>Cash Delivery</span>

          <strong>{cashPercentage}%</strong>
        </div>
      </div>
    </div>
  );
}
