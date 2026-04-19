import React from 'react';

const modalStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'gray',
  padding: '20px',
  zIndex: 9999,
  border: '1px solid #ccc',
  borderRadius: '4px',
  minWidth: '300px',
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 9998,
};

function ProjectModal({ children, onClose }) {
  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle}>
        {/* モーダルのコンテンツ */}
        {children}
        <button onClick={onClose} style={{ marginTop: '10px' }}>閉じる</button>
      </div>
    </>
  );
}

export default ProjectModal;
