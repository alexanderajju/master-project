$(document).ready(
  (onsubmit = () => {
    $("#submit-form").validate({
      rules: {
        name: {
          required: true,
          minlength: 5,
        },

        email: {
          required: true,
          email: true,
        },
        description: {
          required: true,
        },
        subject: {
          required: true,
        },
        Destination: {
          required: true,
        },
        checkin: {
          required: true,
        },
        checkout: {
          required: true,
        },
        mobile: {
          required: true,
          number: true,
          minlength: 10,
        },
      },

      messages: {
        name: {
          required: "enter your name",
        },
      },

      submitHandler: function (form) {
        $.ajax({
          url:
            "https://script.google.com/macros/s/AKfycbxWtuIGHnUMC-ciRKbAvJJbRSXCgkyoaM-RfQoycA/exec",
          data: $("#submit-form").serialize(),
          method: "post",
          success: function (response) {
            alert("Form submitted successfully");
            window.location.reload();
            window.location.href = "/";
          },
          error: function (err) {
            alert("Something Error");
          },
        });
      },
    });
  })
);
