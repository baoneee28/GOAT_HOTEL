import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

if (typeof window !== 'undefined') {
  window.Swal = Swal;
}

export default Swal;
