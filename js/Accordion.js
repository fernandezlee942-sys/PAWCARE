const allDetails = document.querySelectorAll('#FAQ details');

    allDetails.forEach((detail) => {
        detail.addEventListener('click', (e) => {
            if (!detail.open) {
                allDetails.forEach((other) => {
                    if (other !== detail) {
                        other.removeAttribute('open');
                    }
                });
            }
        });
    }
);