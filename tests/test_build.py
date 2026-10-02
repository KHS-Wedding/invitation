import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image
import manage


class ImageBuildTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.output = self.root / 'dist'
        self.output.mkdir()
        self.dist_patch = patch.object(manage, 'DIST', self.output)
        self.dist_patch.start()

    def tearDown(self):
        self.dist_patch.stop()
        self.temporary.cleanup()

    def test_mpo_primary_frame_is_optimized_not_copied(self):
        source = self.root / 'photo.jpg'
        primary = Image.new('RGB', (800, 600), 'red')
        auxiliary = Image.new('RGB', (800, 600), 'blue')
        primary.save(source, format='MPO', save_all=True, append_images=[auxiliary])
        with Image.open(source) as opened:
            self.assertEqual(opened.format, 'MPO')
            self.assertTrue(opened.is_animated)
        relative = manage.optimize_or_copy(source, Path('thumb/01.webp'), max_edge=480, quality=68)
        with Image.open(self.output / relative) as result:
            self.assertEqual(result.format, 'WEBP')
            self.assertEqual(result.size, (480, 360))
            red, green, blue = result.getpixel((20, 20))
            self.assertGreater(red, 220)
            self.assertLess(blue, 30)

    def test_exif_orientation_is_applied_and_metadata_removed(self):
        source = self.root / 'portrait.jpg'
        exif = Image.Exif()
        exif[274] = 6
        Image.new('RGB', (800, 400), 'white').save(source, exif=exif)
        relative = manage.optimize_or_copy(source, Path('thumb/02.webp'), max_edge=480, quality=68)
        with Image.open(self.output / relative) as result:
            self.assertEqual(result.size, (240, 480))
            self.assertFalse(result.getexif())

    def test_changed_image_contents_get_different_cache_urls(self):
        target = self.output / 'cover.webp'
        target.write_bytes(b'first-version')
        first = manage.fingerprint_file('cover.webp')
        target.write_bytes(b'second-version')
        second = manage.fingerprint_file('cover.webp')
        self.assertNotEqual(first, second)
        self.assertTrue((self.output / first).is_file())
        self.assertTrue((self.output / second).is_file())

    def test_natural_order_keeps_photo_sequence(self):
        names = [Path('20.jpg'), Path('2.jpg'), Path('01.jpg'), Path('10.jpg')]
        self.assertEqual([p.name for p in sorted(names, key=manage.natural_key)], ['01.jpg', '2.jpg', '10.jpg', '20.jpg'])

    def test_invalid_thumbnail_size_blocks_deployment(self):
        full = self.output / 'full.webp'
        thumb = self.output / 'thumb.webp'
        Image.new('RGB', (800, 600)).save(full, format='WEBP')
        Image.new('RGB', (800, 600)).save(thumb, format='WEBP')
        config = {'site': {'share_image': 'share.png'}, 'images': {'cover': '', 'map_image': '', 'gallery': [{'src': 'full.webp', 'thumbnail_src': 'thumb.webp'}]}}
        with self.assertRaisesRegex(RuntimeError, 'thumb.webp'):
            manage.validate_output(config)


if __name__ == '__main__':
    unittest.main()
