import 'package:json_annotation/json_annotation.dart';

part 'grpo_document.g.dart';

@JsonSerializable()
class GRPODocument {
  final int id;
  @JsonKey(name: 'po_number')
  final String poNumber;
  @JsonKey(name: 'supplier_code')
  final String? supplierCode;
  @JsonKey(name: 'supplier_name')
  final String? supplierName;
  @JsonKey(name: 'warehouse_code')
  final String? warehouseCode;
  @JsonKey(name: 'user_id')
  final int userId;
  @JsonKey(name: 'qc_approver_id')
  final int? qcApproverId;
  @JsonKey(name: 'qc_approved_at')
  final DateTime? qcApprovedAt;
  @JsonKey(name: 'qc_notes')
  final String? qcNotes;
  final String status; // draft, submitted, qc_approved, posted, rejected
  @JsonKey(name: 'po_total')
  final double? poTotal;
  @JsonKey(name: 'sap_document_number')
  final String? sapDocumentNumber;
  final String? notes;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  
  // Local sync fields
  @JsonKey(name: 'sync_status', defaultValue: 0)
  final int syncStatus; // 0: pending, 1: synced, 2: error
  @JsonKey(name: 'last_synced_at')
  final DateTime? lastSyncedAt;

  const GRPODocument({
    required this.id,
    required this.poNumber,
    this.supplierCode,
    this.supplierName,
    this.warehouseCode,
    required this.userId,
    this.qcApproverId,
    this.qcApprovedAt,
    this.qcNotes,
    required this.status,
    this.poTotal,
    this.sapDocumentNumber,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.syncStatus = 0,
    this.lastSyncedAt,
  });

  factory GRPODocument.fromJson(Map<String, dynamic> json) => 
      _$GRPODocumentFromJson(json);
  Map<String, dynamic> toJson() => _$GRPODocumentToJson(this);

  bool get isDraft => status == 'draft';
  bool get isSubmitted => status == 'submitted';
  bool get isApproved => status == 'qc_approved';
  bool get isRejected => status == 'rejected';
  bool get isPosted => status == 'posted';
  bool get canEdit => isDraft;
  bool get canSubmit => isDraft;

  String get statusDisplayName {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'qc_approved':
        return 'QC Approved';
      case 'posted':
        return 'Posted';
      case 'rejected':
        return 'Rejected';
      default:
        return status.toUpperCase();
    }
  }
}