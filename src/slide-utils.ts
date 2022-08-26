function slideToObjectAndAttach(game: Game, object: HTMLElement, destinationId: string, changeSide: boolean = false) {
    const destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return;
    }

    const originBR = object.getBoundingClientRect();
    destination.appendChild(object);
    
    if (document.visibilityState !== 'hidden' && !(game as any).instantaneousMode) {
        const destinationBR = object.getBoundingClientRect();

        const deltaX = destinationBR.left - originBR.left;
        const deltaY = destinationBR.top - originBR.top;
        
        object.style.zIndex = '10';
        object.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
        if (destination.dataset.currentPlayer == 'false') {
            object.style.order = null;
            object.style.position = 'absolute';
        }

        setTimeout(() => {
            object.style.transition = `transform 0.5s linear`;
            object.style.transform = null;
        });
        setTimeout(() => {
            object.style.zIndex = null;
            object.style.transition = null;
            object.style.position = null;
        }, 600);
    } else {        
        object.style.order = null;
    }
}

function slideFromObject(game: Game, object: HTMLElement, fromId: string) {
    const from = document.getElementById(fromId);
    const originBR = from.getBoundingClientRect();
    
    if (document.visibilityState !== 'hidden' && !(game as any).instantaneousMode) {
        const destinationBR = object.getBoundingClientRect();

        const deltaX = destinationBR.left - originBR.left;
        const deltaY = destinationBR.top - originBR.top;

        object.style.zIndex = '10';
        object.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
        if (object.parentElement.dataset.currentPlayer == 'false') {
            object.style.position = 'absolute';
        }

        setTimeout(() => {
            object.style.transition = `transform 0.5s linear`;
            object.style.transform = null;
        });
        setTimeout(() => {
            object.style.zIndex = null;
            object.style.transition = null;
            object.style.position = null;
        }, 600);
    }
}