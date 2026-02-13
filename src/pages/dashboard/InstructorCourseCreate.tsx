import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockCategories } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import {
  Upload, Image, Video, PlusCircle, Trash2, GripVertical,
  ChevronDown, ChevronUp, Save, Send, ArrowLeft, FileText, Globe,
} from 'lucide-react';

interface SectionForm {
  id: string;
  title: string;
  titleAm: string;
  lessons: LessonForm[];
  isExpanded: boolean;
}

interface LessonForm {
  id: string;
  title: string;
  titleAm: string;
  type: 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'QUIZ';
  videoFile: File | null;
  videoUrl: string;
  documentFile: File | null;
  content: string;
  duration: number;
  isFree: boolean;
  isDownloadable: boolean;
}

const emptyCourse = {
  title: '', titleAm: '', titleOm: '', titleGz: '', slug: '',
  description: '', descriptionAm: '', descriptionOm: '', descriptionGz: '',
  categoryId: '', level: '' as string,
  price: '', discountPrice: '', currency: 'ETB',
  thumbnailFile: null as File | null,
  thumbnailPreview: '',
  previewVideoFile: null as File | null,
  previewVideoName: '',
};

const createLesson = (): LessonForm => ({
  id: crypto.randomUUID(),
  title: '', titleAm: '', type: 'VIDEO',
  videoFile: null, videoUrl: '', documentFile: null,
  content: '', duration: 0, isFree: false, isDownloadable: false,
});

const createSection = (): SectionForm => ({
  id: crypto.randomUUID(),
  title: '', titleAm: '',
  lessons: [createLesson()],
  isExpanded: true,
});

const InstructorCourseCreate = () => {
  const navigate = useNavigate();
  const [course, setCourse] = useState(emptyCourse);
  const [sections, setSections] = useState<SectionForm[]>([createSection()]);
  const [activeTab, setActiveTab] = useState('basic');

  const updateCourse = (field: string, value: string | File | null) => {
    setCourse((prev) => ({ ...prev, [field]: value }));
  };

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateCourse('thumbnailFile', file);
      updateCourse('thumbnailPreview', URL.createObjectURL(file));
    }
  };

  const handlePreviewVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateCourse('previewVideoFile', file);
      updateCourse('previewVideoName', file.name);
    }
  };

  const addSection = () => setSections((prev) => [...prev, createSection()]);

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, field: string, value: string | boolean) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s))
    );
  };

  const addLesson = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, lessons: [...s.lessons, createLesson()] } : s
      )
    );
  };

  const removeLesson = (sectionId: string, lessonId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
          : s
      )
    );
  };

  const updateLesson = (sectionId: string, lessonId: string, field: string, value: unknown) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId ? { ...l, [field]: value } : l
              ),
            }
          : s
      )
    );
  };

  const handleLessonVideo = (sectionId: string, lessonId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateLesson(sectionId, lessonId, 'videoFile', file);
      updateLesson(sectionId, lessonId, 'videoUrl', file.name);
    }
  };

  const handleLessonDocument = (sectionId: string, lessonId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateLesson(sectionId, lessonId, 'documentFile', file);
    }
  };

  const handleSaveDraft = () => {
    toast({ title: 'Course saved as draft', description: 'You can continue editing later.' });
  };

  const handleSubmit = () => {
    if (!course.title || !course.description || !course.categoryId || !course.level) {
      toast({ title: 'Missing required fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Course submitted for review', description: 'Your course has been submitted and will be reviewed by an admin.' });
    navigate('/instructor');
  };

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/instructor')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">Create New Course</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {sections.length} sections · {totalLessons} lessons
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
              <Save className="h-4 w-4" /> Save Draft
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              <Send className="h-4 w-4" /> Submit for Review
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="localization">
              <Globe className="h-3 w-3 mr-1" /> Localization
            </TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="title">Course Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Complete Web Development Bootcamp 2026"
                      value={course.title}
                      onChange={(e) => updateCourse('title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={course.categoryId} onValueChange={(v) => updateCourse('categoryId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level *</Label>
                    <Select value={course.level} onValueChange={(v) => updateCourse('level', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="ALL_LEVELS">All Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      rows={5}
                      placeholder="What will students learn? Why should they take this course?"
                      value={course.description}
                      onChange={(e) => updateCourse('description', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media */}
          <TabsContent value="media" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-full sm:w-64 h-40 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {course.thumbnailPreview ? (
                      <img src={course.thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Image className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">750×422 recommended</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Upload thumbnail image</Label>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Max 5MB.</p>
                    <label className="inline-flex cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
                      <Button variant="outline" size="sm" asChild>
                        <span><Upload className="h-4 w-4 mr-2" /> Choose Image</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Upload a short preview video that shows students what they'll learn. This appears on the course page.
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex cursor-pointer">
                      <input type="file" accept="video/*" className="hidden" onChange={handlePreviewVideo} />
                      <Button variant="outline" size="sm" asChild>
                        <span><Video className="h-4 w-4 mr-2" /> Upload Video</span>
                      </Button>
                    </label>
                    {course.previewVideoName && (
                      <Badge variant="secondary" className="gap-1">
                        <Video className="h-3 w-3" /> {course.previewVideoName}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum */}
          <TabsContent value="curriculum" className="space-y-4 mt-6">
            {sections.map((section, sIndex) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-xs font-medium text-muted-foreground">Section {sIndex + 1}</span>
                    <div className="flex-1">
                      <Input
                        placeholder="Section title (e.g., Getting Started)"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        className="h-8 text-sm font-semibold"
                      />
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => updateSection(section.id, 'isExpanded', !section.isExpanded)}
                    >
                      {section.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {sections.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSection(section.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {section.isExpanded && (
                  <CardContent className="space-y-3">
                    {section.lessons.map((lesson, lIndex) => (
                      <div key={lesson.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                          <span className="text-xs text-muted-foreground font-medium">Lesson {lIndex + 1}</span>
                          <div className="flex-1">
                            <Input
                              placeholder="Lesson title"
                              value={lesson.title}
                              onChange={(e) => updateLesson(section.id, lesson.id, 'title', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          {section.lessons.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLesson(section.id, lesson.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={lesson.type}
                              onValueChange={(v) => updateLesson(section.id, lesson.id, 'type', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VIDEO">Video</SelectItem>
                                <SelectItem value="DOCUMENT">Document</SelectItem>
                                <SelectItem value="TEXT">Text</SelectItem>
                                <SelectItem value="QUIZ">Quiz</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Duration (min)</Label>
                            <Input
                              type="number"
                              min={0}
                              className="h-8 text-xs"
                              value={lesson.duration || ''}
                              onChange={(e) => updateLesson(section.id, lesson.id, 'duration', Number(e.target.value))}
                            />
                          </div>
                          <div className="flex items-end gap-4 sm:col-span-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={lesson.isFree}
                                onCheckedChange={(v) => updateLesson(section.id, lesson.id, 'isFree', v)}
                              />
                              <Label className="text-xs">Free Preview</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={lesson.isDownloadable}
                                onCheckedChange={(v) => updateLesson(section.id, lesson.id, 'isDownloadable', v)}
                              />
                              <Label className="text-xs">Downloadable</Label>
                            </div>
                          </div>
                        </div>

                        {/* Upload area based on type */}
                        {lesson.type === 'VIDEO' && (
                          <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer">
                              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleLessonVideo(section.id, lesson.id, e)} />
                              <Button variant="outline" size="sm" asChild>
                                <span><Video className="h-3 w-3 mr-1" /> Upload Video</span>
                              </Button>
                            </label>
                            {lesson.videoUrl && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{lesson.videoUrl}</span>
                            )}
                          </div>
                        )}
                        {lesson.type === 'DOCUMENT' && (
                          <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer">
                              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={(e) => handleLessonDocument(section.id, lesson.id, e)} />
                              <Button variant="outline" size="sm" asChild>
                                <span><FileText className="h-3 w-3 mr-1" /> Upload Document</span>
                              </Button>
                            </label>
                            {lesson.documentFile && (
                              <span className="text-xs text-muted-foreground">{lesson.documentFile.name}</span>
                            )}
                          </div>
                        )}
                        {lesson.type === 'TEXT' && (
                          <Textarea
                            placeholder="Write lesson content here..."
                            rows={3}
                            value={lesson.content}
                            onChange={(e) => updateLesson(section.id, lesson.id, 'content', e.target.value)}
                            className="text-sm"
                          />
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addLesson(section.id)} className="gap-1">
                      <PlusCircle className="h-3 w-3" /> Add Lesson
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
            <Button variant="outline" onClick={addSection} className="gap-2 w-full">
              <PlusCircle className="h-4 w-4" /> Add Section
            </Button>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={course.currency} onValueChange={(v) => updateCourse('currency', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETB">ETB (Birr)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Original Price *</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="1499"
                      value={course.price}
                      onChange={(e) => updateCourse('price', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Price</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="299"
                      value={course.discountPrice}
                      onChange={(e) => updateCourse('discountPrice', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Localization */}
          <TabsContent value="localization" className="space-y-6 mt-6">
            {/* Amharic */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Amharic Translation (አማርኛ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title (Amharic)</Label>
                  <Input placeholder="ርዕስ በአማርኛ" value={course.titleAm} onChange={(e) => updateCourse('titleAm', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description (Amharic)</Label>
                  <Textarea rows={4} placeholder="ገለጻ በአማርኛ" value={course.descriptionAm} onChange={(e) => updateCourse('descriptionAm', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Oromifa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Oromifa Translation (Afaan Oromoo)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title (Oromifa)</Label>
                  <Input placeholder="Mata duree Afaan Oromootiin" value={course.titleOm} onChange={(e) => updateCourse('titleOm', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description (Oromifa)</Label>
                  <Textarea rows={4} placeholder="Ibsa Afaan Oromootiin" value={course.descriptionOm} onChange={(e) => updateCourse('descriptionOm', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Geez */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Geez Translation (ግዕዝ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title (Geez)</Label>
                  <Input placeholder="ርእስ ብግዕዝ" value={course.titleGz} onChange={(e) => updateCourse('titleGz', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description (Geez)</Label>
                  <Textarea rows={4} placeholder="ገለጻ ብግዕዝ" value={course.descriptionGz} onChange={(e) => updateCourse('descriptionGz', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InstructorCourseCreate;
