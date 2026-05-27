export function
showNotification(

  titulo,

  body

) {

  if (

    Notification.permission ===
    "granted"

  ) {

    new Notification(

      titulo,

      {

        body,

        icon:"/icon-192.png"

      }

    );

  }

}