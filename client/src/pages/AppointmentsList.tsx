import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Visibility } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";
import AppointmentForm from "../components/AppointmentForm";
import type {
  Appointment,
  AppointmentDetail,
  GetAppointmentsParams,
  AxiosErrorResponse,
} from "../api";
import { getAppointments, getAppointment, deleteAppointment } from "../api";

dayjs.extend(utc);

export default function AppointmentsList() {
  const { customer } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDetail | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);
  const [onEdit, setOnEdit] = useState<Appointment | null | undefined>(
    undefined
  );

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetAppointmentsParams = {};
      if (nameFilter) params.name = nameFilter;
      if (fromDate) params.fromDate = fromDate.startOf("day").toISOString();
      if (toDate) params.toDate = toDate.endOf("day").toISOString();

      const data = await getAppointments(params);
      // Sort by appointmentDate
      data.sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      );
      setAppointments(data);
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as AxiosErrorResponse).response?.data?.message
          : undefined;
      showToast(message || "Error loading appointments", "error");
    } finally {
      setLoading(false);
    }
  }, [nameFilter, fromDate, toDate, showToast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleViewDetail = async (appointment: Appointment) => {
    try {
      const detail = await getAppointment(appointment.id);
      setSelectedAppointment(detail);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as AxiosErrorResponse).response?.data?.message
          : undefined;
      showToast(message || "Error loading appointment details", "error");
    }
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;

    try {
      await deleteAppointment(appointmentToDelete.id);
      showToast("Appointment deleted successfully", "success");
      setDeleteConfirmOpen(false);
      setAppointmentToDelete(null);
      fetchAppointments();
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as AxiosErrorResponse).response?.data?.message
          : undefined;
      showToast(message || "Error deleting appointment", "error");
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setOnEdit(appointment);
  };

  const handleCreate = () => {
    setOnEdit(null); // null means create mode, undefined means closed
  };

  const isOwner = (appointment: Appointment) => {
    return customer && appointment.userName === customer.userName;
  };

  const canDeleteToday = (appointment: Appointment) => {
    const appointmentDate = dayjs(appointment.appointmentDate);
    const today = dayjs();
    return !appointmentDate.isSame(today, "day");
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("DD/MM/YYYY HH:mm");
  };

  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{ color: "white" }}
        >
          Appointments List
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
          sx={{ borderRadius: 2 }}
        >
          New Appointment
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            label="Search by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From date"
              value={fromDate}
              onChange={(date) => setFromDate(date)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: 200 },
                },
              }}
            />
            <DatePicker
              label="To date"
              value={toDate}
              onChange={(date) => setToDate(date)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: 200 },
                },
              }}
            />
          </LocalizationProvider>
          <Button
            variant="outlined"
            onClick={fetchAppointments}
            sx={{ borderRadius: 2 }}
          >
            Search
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setNameFilter("");
              setFromDate(null);
              setToDate(null);
              fetchAppointments();
            }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer Name</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Grooming Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No appointments to display
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleViewDetail(appointment)}
                  >
                    <TableCell>
                      {appointment.firstName} ({appointment.userName})
                    </TableCell>
                    <TableCell>
                      {formatDate(appointment.appointmentDate)}
                    </TableCell>
                    <TableCell>
                      <Chip label={appointment.groomingType} size="small" />
                    </TableCell>
                    <TableCell>{formatPrice(appointment.price)}</TableCell>
                    <TableCell
                      align="center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetail(appointment)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {isOwner(appointment) && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(appointment)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              !canDeleteToday(appointment)
                                ? "Cannot delete appointment on the same day"
                                : "Delete"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(appointment)}
                                color="error"
                                disabled={!canDeleteToday(appointment)}
                              >
                                <Delete />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Modal */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Customer Name
                </Typography>
                <Typography variant="body1">
                  {selectedAppointment.firstName} (
                  {selectedAppointment.userName})
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date & Time
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedAppointment.appointmentDate)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Grooming Type
                </Typography>
                <Typography variant="body1">
                  {selectedAppointment.groomingType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1">
                  {selectedAppointment.durationMinutes} minutes
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatPrice(selectedAppointment.price)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedAppointment.createdAt)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Appointment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this appointment?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Form Modal */}
      {onEdit !== undefined && (
        <AppointmentForm
          open={true}
          appointment={onEdit}
          onClose={() => setOnEdit(undefined)}
          onSuccess={() => {
            setOnEdit(undefined);
            fetchAppointments();
          }}
        />
      )}
    </Box>
  );
}
