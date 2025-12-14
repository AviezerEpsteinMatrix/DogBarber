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
import timezone from "dayjs/plugin/timezone";
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
import { dictionary } from "../dictionary";

dayjs.extend(utc);
dayjs.extend(timezone);

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
  const [loadingDetail, setLoadingDetail] = useState(false);
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
      if (fromDate) params.fromDate = fromDate.format("YYYY-MM-DD");
      if (toDate) params.toDate = toDate.format("YYYY-MM-DD");

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
      showToast(message || dictionary.errorLoadingAppointments, "error");
    } finally {
      setLoading(false);
    }
  }, [nameFilter, fromDate, toDate, showToast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleViewDetail = async (appointment: Appointment) => {
    // Prevent duplicate requests
    if (loadingDetail) return;

    // If clicking the same appointment and modal is already open, just return
    if (detailOpen && selectedAppointment?.id === appointment.id) {
      return;
    }

    setLoadingDetail(true);
    try {
      const detail = await getAppointment(appointment.id);
      setSelectedAppointment(detail);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as AxiosErrorResponse).response?.data?.message
          : undefined;
      showToast(message || dictionary.errorLoadingAppointmentDetails, "error");
    } finally {
      setLoadingDetail(false);
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
      // 204 No Content - success
      showToast(dictionary.appointmentDeletedSuccessfully, "success");
      setDeleteConfirmOpen(false);
      setAppointmentToDelete(null);
      // Remove from list client-side
      setAppointments((prev) =>
        prev.filter((a) => a.id !== appointmentToDelete.id)
      );
    } catch (error) {
      // Handle 400 Bad Request with server message
      const errorResponse = error as AxiosErrorResponse;
      let message: string = dictionary.errorDeletingAppointment;

      if (errorResponse.response?.status === 400) {
        // Server returns error message in response body as { "error": "..." }
        const errorData = errorResponse.response.data as {
          error?: string;
          message?: string;
        };
        if (errorData?.error) {
          message = errorData.error;
        } else if (errorData?.message) {
          message = errorData.message;
        }
      } else if (
        errorResponse.response?.status === 401 ||
        errorResponse.response?.status === 403
      ) {
        message = "אין הרשאה למחוק תור זה";
      }

      showToast(message, "error");
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
    // Parse UTC date and compare with today in local timezone
    const appointmentDate = dayjs.utc(appointment.appointmentDate).local();
    const today = dayjs().startOf("day");
    const appointmentDay = appointmentDate.startOf("day");
    return !appointmentDay.isSame(today, "day");
  };

  const formatDate = (dateString: string) => {
    // Convert UTC to local time for display
    return dayjs.utc(dateString).local().format("DD/MM/YYYY HH:mm");
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
          {dictionary.appointmentsList}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
          sx={{ borderRadius: 2 }}
        >
          {dictionary.newAppointment}
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
            label={dictionary.searchByName}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={dictionary.fromDate}
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
              label={dictionary.toDate}
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
            {dictionary.search}
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
            {dictionary.clear}
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
                <TableCell>{dictionary.username}</TableCell>
                <TableCell>{dictionary.dateAndTime}</TableCell>
                <TableCell>{dictionary.groomingType}</TableCell>
                <TableCell align="center">{dictionary.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {dictionary.noAppointmentsToDisplay}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    hover
                    sx={{ cursor: loadingDetail ? "wait" : "pointer" }}
                    onClick={(e) => {
                      // Don't trigger if clicking on action buttons
                      if (
                        (e.target as HTMLElement).closest(
                          'button, [role="button"]'
                        )
                      ) {
                        return;
                      }
                      handleViewDetail(appointment);
                    }}
                  >
                    <TableCell>{appointment.userName}</TableCell>
                    <TableCell>
                      {formatDate(appointment.appointmentDate)}
                    </TableCell>
                    <TableCell>
                      <Chip label={appointment.groomingType} size="small" />
                    </TableCell>
                    <TableCell
                      align="center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title={dictionary.viewDetails}>
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
                          <Tooltip title={dictionary.edit}>
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
                                ? dictionary.cannotDeleteAppointmentSameDay
                                : dictionary.delete
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
        <DialogTitle>{dictionary.appointmentDetails}</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {dictionary.username}
                </Typography>
                <Typography variant="body1">
                  {selectedAppointment.userName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {dictionary.firstName}
                </Typography>
                <Typography variant="body1">
                  {selectedAppointment.firstName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {dictionary.dateAndTime}
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedAppointment.appointmentDate)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {dictionary.groomingType}
                </Typography>
                <Typography variant="body1">
                  {selectedAppointment.groomingType}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {dictionary.duration}
                </Typography>
                <Typography variant="body1">
                  {selectedAppointment.durationMinutes} {dictionary.minutes}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {dictionary.price}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatPrice(selectedAppointment.price)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {dictionary.createdAt}
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedAppointment.createdAt)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>
            {dictionary.close}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>{dictionary.deleteAppointment}</DialogTitle>
        <DialogContent>
          <Typography>{dictionary.confirmDeleteAppointment}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {dictionary.cancel}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            {dictionary.delete}
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
