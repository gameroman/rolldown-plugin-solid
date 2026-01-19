import { createSignal } from "solid-js";
import { Portal } from "solid-js/web";

const Modal = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [message, setMessage] = createSignal("");

  const openModal = (msg: string) => {
    setMessage(msg);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <div class="portal-example">
      <h2>Portal Example</h2>
      <button onClick={() => openModal("Hello from Portal!")}>
        Open Modal
      </button>
      <button onClick={() => openModal("Different message")}>
        Open Different Modal
      </button>

      {isOpen() && (
        <Portal mount={document.getElementById("modal-root")!}>
          <div class="modal-overlay" onClick={closeModal}>
            <div class="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Modal</h3>
              <p>{message()}</p>
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </Portal>
      )}

      <Portal mount={document.getElementById("notifications")!}>
        <div class="notification">
          <p>This notification is always rendered in a different container</p>
        </div>
      </Portal>

      <Portal>
        <div class="tooltip" style="position: fixed; top: 10px; right: 10px;">
          This tooltip is rendered directly to document.body
        </div>
      </Portal>
    </div>
  );
};

export default Modal;
