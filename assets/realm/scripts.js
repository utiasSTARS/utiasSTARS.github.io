//
// Scripts
// 

document.addEventListener("DOMContentLoaded", function() {
    // Function to open the modal
    window.openModal = function(modalId) {
      document.getElementById(modalId).style.display = "flex";
    }

    // Function to close the modal
    window.closeModal = function(modalId) {
      document.getElementById(modalId).style.display = "none";
    }

    // Function to close modal if clicking outside the modal content
    window.closeModalOutside = function(event, modalId) {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
          closeModal(modalId);
        }
      }
  });


document.addEventListener('DOMContentLoaded', function() {
    // do this for each video element (5 in total)
    for (let i = 1; i <= 5; i++) {
        const video = document.getElementById(`video_${i}`);
        const slider = document.getElementById(`slider_${i}`);

        slider.addEventListener('input', function() {
            const segmentIndex = parseInt(slider.value);
            const videoHeight = video.parentElement.offsetHeight; // Get the height of the video container
            const offsetY = segmentIndex * videoHeight;

            video.style.transform = `translateY(-${offsetY}px)`;
        });
    }
});


