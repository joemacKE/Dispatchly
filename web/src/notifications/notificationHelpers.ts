import type { Notification } from "./NotificationContext";


export function buildNotification(
  eventType:string,
): Omit<Notification,"id"|"read"> | null {


  switch(eventType){


    case "delivery.created":

      return {
        title:"New Delivery Request",

        message:
          "A retailer created a new delivery request.",

        time:"Just now",

        type:eventType,
      };



    case "delivery.assigned":

      return {
        title:"Delivery Assigned",

        message:
          "A rider has been assigned to a delivery.",

        time:"Just now",

        type:eventType,
      };



    case "delivery.status_changed":

      return {
        title:"Delivery Updated",

        message:
          "A delivery status has changed.",

        time:"Just now",

        type:eventType,
      };



    case "delivery.delivered":

      return {
        title:"Delivery Completed",

        message:
          "A delivery has been completed successfully.",

        time:"Just now",

        type:eventType,
      };


    default:

      return null;

  }

}